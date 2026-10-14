import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseCatalog,effectiveSource,sourceSignature,matchCatalogTranslation} from './translation-audit.mjs';
import {catalogPath}from'./apply-context-review.mjs';

// A structural reader, not an interpreter of the game engine. No global order
// is inferred from physical order, trigger names, event names or delay values.
export function parseMissionBlocks(text) {
 if(typeof text!=='string'||text.includes('\0'))throw new Error('Expected non-binary mission text');
 let at=0,line=1,serial=0;const nodes=[],issues=[];
 const root={id:0,head:'<root>',values:[],children:[],items:[],line:1,endLine:1,start:0,end:text.length,parentId:null};
 const stack=[root];
 function advance(){const c=text[at++];if(c==='\n')line++;return c;}
 function atom(){const start=at,l=line;let value='';
  if(text[at]==='"'){advance();let closed=false;while(at<text.length){const c=advance();if(c==='"'){closed=true;break;}if(c==='\\'&&(text[at]==='"'||text[at]==='\\'))value+=advance();else value+=c;}if(!closed)issues.push({type:'unterminated-string',line:l});return{value,line:l,start,quoted:true};}
  while(at<text.length&&!/[\s{}]/.test(text[at]))value+=advance();return{value,line:l,start,quoted:false};
 }
 while(at<text.length){
  if(/\s/.test(text[at])){advance();continue;}
  if(text.startsWith('//',at)){while(at<text.length&&text[at]!=='\n')advance();continue;}
  if(text.startsWith('/*',at)){const l=line;advance();advance();while(at<text.length&&!text.startsWith('*/',at))advance();if(at===text.length)issues.push({type:'unterminated-comment',line:l});else{advance();advance();}continue;}
  if(text[at]==='{'){const parent=stack.at(-1);const n={id:++serial,head:null,values:[],children:[],items:[],line,start:at,parentId:parent.id};advance();parent.children.push(n);parent.items.push({node:n});nodes.push(n);stack.push(n);continue;}
  if(text[at]==='}'){if(stack.length===1){issues.push({type:'unmatched-closing-brace',line});advance();continue;}const n=stack.pop();n.endLine=line;advance();n.end=at;continue;}
  const token=atom();const n=stack.at(-1);if(n.head===null)n.head=token.value;else{n.values.push(token.value);n.items.push({atom:token});}
 }
 for(const n of stack.slice(1)){n.endLine=line;n.end=at;issues.push({type:'unclosed-block',line:n.line,head:n.head});}
 root.endLine=line;return{root,nodes,issues};
}
const descendants=n=>{const out=[];function visit(x){out.push(x);for(const c of x.children)visit(c);}visit(n);return out;};
const child=(n,name)=>n?.children.find(c=>c.head?.toLowerCase()===name.toLowerCase());
const field=(n,name)=>child(n,name)?.values??[];
const concise=n=>({head:n.head,values:n.values,line:n.line,...(n.head==='##'?{marker:'##',markerMeaning:'uninterpreted-engine-marker'}:{}),...(child(n,'disabled')?{explicitDisabled:true}:{}),children:n.children.map(concise)});
const blockName=n=>n.head==='##'&&n.values.length?n.values[0]:n.head;
const inactive=n=>Boolean(child(n,'disabled'));
const marked=n=>n.head==='##';
const status=nodes=>nodes.some(inactive)?'explicit-disabled-ancestry':nodes.some(marked)?'marked-ancestry-runtime-status-unresolved':'unmarked-runtime-not-certified';
const branchNode=n=>/^(?:if|else|elseif|while|loop|parallel|thread|fork|switch|case|default)$/i.test(blockName(n)??'');
const guard=n=>({kind:blockName(n),line:n.line,values:n.values,condition:selector(child(n,'condition')),selector:selector(child(n,'selector')),caseFields:n.children.filter(c=>/^(?:value|casevalue|option|selected|name|type|index|expression)$/i.test(c.head??'')).map(concise)});
function ancestry(n,byId){const out=[];for(let p=byId.get(n.parentId);p&&p.id;p=byId.get(p.parentId))out.push(p);return out;}
function selector(n){if(!n)return null;return concise(n);}
export function normalizeMissionTextKey(key,missionContext){
 if(typeof key!=='string'||!key.trim())return null;
 if(key.startsWith('$/'))return missionContext?missionContext.replace(/\/$/,'')+key.slice(1):null;
 if(key.startsWith('/'))return key.slice(1);
 if(key.startsWith('mission/')||key.startsWith('desc/')||key.startsWith('interface/'))return key;
 return null; // Plain strings can be literals or engine aliases: do not guess.
}
export function indexMissionContext(text,{archive=null,entry='<memory>',missionContext=null}={}) {
 const parsed=parseMissionBlocks(text),byId=new Map([[0,parsed.root],...parsed.nodes.map(n=>[n.id,n])]);
 const containers=parsed.nodes.filter(n=>['triggers','functions'].includes(n.head?.toLowerCase()));
 const blockNodes=containers.flatMap(c=>c.children.map(n=>({node:n,kind:c.head.toLowerCase()==='triggers'?'trigger':'function'})));
 const blockIds=new Map(blockNodes.map(({node:n,kind})=>[n.id,kind+':'+blockName(n)+'@'+n.line]));
 const nearestOwner=n=>ancestry(n,byId).find(a=>blockIds.has(a.id));
 const nearestNamed=n=>ancestry(n,byId).find(a=>a.head&&!['actions','condition','terms','selector','triggers','functions','mission'].includes(a.head.toLowerCase()));
 const entities=parsed.nodes.filter(n=>/^(?:Human|Entity|Vehicle|Gun)$/i.test(n.head??'')&&n.values.some(v=>/^0x[\da-f]+$/i.test(v))).map(n=>({entityId:n.values.find(v=>/^0x[\da-f]+$/i.test(v)).toLowerCase(),kind:n.head,model:n.values[0],line:n.line,tags:[],details:n.children.filter(c=>/^(?:Player|Breed|NameId|Inventory|Item|Crew|Seat|Team|Squad)$/i.test(c.head??'')).map(concise)}));
 const entityMap=new Map(entities.map(e=>[e.entityId,e]));
 for(const n of parsed.nodes.filter(n=>n.head?.toLowerCase()==='tags')){const id=n.values.find(v=>/^0x[\da-f]+$/i.test(v))?.toLowerCase();if(entityMap.has(id))entityMap.get(id).tags.push(...n.values.filter(v=>v!==id&&!/^0x/i.test(v)));}
 const blocks=blockNodes.map(({node:n,kind})=>{const a=child(n,'actions'),parents=ancestry(n,byId);return{id:blockIds.get(n.id),kind,name:blockName(n),originalHead:n.head,marker:n.head==='##'?'##':null,explicitDisabled:Boolean(child(n,'disabled')),disabled:inactive(n)||parents.some(inactive),executionStatus:status([n,...parents]),line:n.line,endLine:n.endLine,condition:selector(child(n,'condition')),actions:(a?a.children:kind==='function'?n.children:[]).map(concise)};});
 const callers=[];
 for(const n of parsed.nodes){for(const key of n.values){const context=normalizeMissionTextKey(key,missionContext);if(!context)continue;const parents=ancestry(n,byId);const talk=parents.find(a=>/^(?:talk|say|speech|subtitle)$/i.test(blockName(a)??''));const owner=nearestOwner(n);const s=child(talk,'selector');const tags=s?descendants(s).filter(x=>x.head?.toLowerCase()==='tag').flatMap(x=>x.values):[];
  const simpleSelector=Boolean(s&&s.values.length===0&&s.children.length===1&&s.children[0].head?.toLowerCase()==='tag'&&s.children[0].values.length===1&&s.children[0].children.length===0&&/^[\p{L}\p{N}_./:\[\]-]+$/u.test(s.children[0].values[0]));
  const candidates=simpleSelector?entities.filter(e=>e.tags.includes(tags[0])):[];
  const inactiveAncestors=[n,...parents].filter(a=>inactive(a)||marked(a)).map(a=>({head:a.head,name:blockName(a),line:a.line,marker:a.head==='##'?'##':null,explicitDisabled:Boolean(child(a,'disabled'))}));
  callers.push({key,context,line:n.line,field:n.head,command:talk?blockName(talk):null,ownerId:owner?blockIds.get(owner.id):null,ownerName:owner?blockName(owner):nearestNamed(n)?.head??null,ownerKind:owner?blockNodes.find(b=>b.node===owner)?.kind:null,talkLine:talk?.line??null,disabled:[n,...parents].some(inactive),executionStatus:status([n,...parents]),inactiveAncestors,speakerSelector:selector(s),selectorLogic:simpleSelector?'single-literal-positive-tag':'complex-or-absent-not-interpreted',speakerEntityCandidates:candidates.map(e=>e.entityId),speakerBinding:!talk?'not-a-speech-action':!s?'speaker-selector-absent':!simpleSelector?'complex-selector-unresolved':candidates.length===1?'single-static-tag-candidate':candidates.length>1?'multiple-static-tag-candidates':'dynamic-or-unresolved-selector',explicitSpeechTiming:talk?talk.children.filter(c=>/^(?:time|duration|delay)$/i.test(c.head??'')).map(concise):[],actionPath:parents.filter(a=>a.id!==owner?.id&&a.head!=='mission'&&!['selector','condition','terms'].includes(a.head??'')).map(a=>({head:a.head,line:a.line})),guards:parents.filter(branchNode).map(guard),ordering:'structural-caller-only-no-runtime-order'});
 }}
 const edges=[];
 const nameToIds=new Map();for(const b of blocks){const key=b.kind+':'+b.name;if(!nameToIds.has(key))nameToIds.set(key,[]);nameToIds.get(key).push(b.id);}
 for(const n of parsed.nodes){const owner=nearestOwner(n);if(!owner)continue;const ownerId=blockIds.get(owner.id),parents=ancestry(n,byId),underCondition=parents.some(a=>a.head?.toLowerCase()==='condition'),disabled=[n,...parents].some(inactive),executionStatus=status([n,...parents]);
  if(blockName(n)?.toLowerCase()==='call'){const target=field(n,'function')[0]??field(n,'name')[0];if(target)edges.push({from:ownerId,to:'function:'+target,type:'static-function-call-not-time-order',line:n.line,disabled,executionStatus,resolvedTargets:nameToIds.get('function:'+target)??[],guards:parents.filter(branchNode).map(guard)});}
  if(blockName(n)?.toLowerCase()==='trigger'){const target=field(n,'name')[0]??field(n,'trigger')[0]??(n.head==='##'?n.values[1]:n.values[0]);if(target)edges.push({from:ownerId,to:'trigger:'+target,type:'static-trigger-call-not-time-order',line:n.line,disabled,executionStatus,resolvedTargets:nameToIds.get('trigger:'+target)??[],guards:parents.filter(branchNode).map(guard)});}
  if(/^(?:\d+\.)?event$/i.test(blockName(n)??'')){const id=field(n,underCondition?'id':'event')[0]??field(n,'id')[0]??n.values[0];if(id)edges.push({from:underCondition?'event:'+id:ownerId,to:underCondition?ownerId:'event:'+id,type:underCondition?'event-condition-dependency-not-sequence':'event-state-write-not-time-order',line:n.line,disabled,executionStatus,mode:field(n,'mode')[0]??null,conditionOwnerLine:underCondition?parents.find(a=>a.head?.toLowerCase()==='condition')?.line:null});}
  if(blockName(n)?.toLowerCase()==='task'){const name=field(n,'name')[0],state=field(n,'state')[0];if(name)edges.push({from:underCondition?'task:'+name:ownerId,to:underCondition?ownerId:'task:'+name,type:underCondition?'task-condition-dependency-not-sequence':'task-state-write-not-time-order',state:state??null,line:n.line,disabled,executionStatus});}
 }
 const duplicateNames=[...nameToIds.entries()].filter(([,ids])=>ids.length>1).map(([name,ids])=>({type:'duplicate-block-name',name,ids}));
 return{schemaVersion:1,archive,entry,missionContext,bytes:Buffer.byteLength(text,'utf8'),sha256:crypto.createHash('sha256').update(text).digest('hex'),totalLines:parsed.root.endLine,blocks,callers,entities,edges,issues:[...parsed.issues,...duplicateNames],limitations:['Static structure only; no scheduling, timing, condition truth, emitter execution or speech playback certified.','Selector/tag bindings describe stored entities; spawning, tag mutation and script state can change candidates.','Event/condition and function-call edges are dependencies, not a total execution order.']};
}
export function validateMissionContextLedger(ledger,repo) {
 const issues=[];if(ledger.schemaVersion!==1||!Array.isArray(ledger.catalogs)||!Array.isArray(ledger.scripts))throw new Error('Invalid mission-context ledger schema');
 const sourceFiles=new Set(),expectedFiles=new Set();let associations=0;
 const enRoot=path.resolve(repo,'localization/en'),ptRoot=path.resolve(repo,'localization/pt_BR');const normalize=p=>process.platform==='win32'?p.toLowerCase():p;
 const exceptionFile=path.join(repo,'translation/source-exceptions.json'),exceptions=fs.existsSync(exceptionFile)?JSON.parse(fs.readFileSync(exceptionFile,'utf8')):[];
 function associate(en,pt,context,source,file){let a=matchCatalogTranslation(en,pt,context,source);if(a.matches.length===0){const ex=exceptions.find(x=>x.file===file&&x.context===context&&x.englishSource===source);if(ex)a=matchCatalogTranslation(pt,pt,context,ex.acceptedPortugueseSource);}return a;}
 function walk(dir,relative){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw new Error('Mission inventory symlink rejected');if(e.isDirectory())walk(path.join(dir,e.name),relative+e.name+'/');else if(e.name.endsWith('.pot'))expectedFiles.add(relative+e.name);}}
 walk(path.join(enRoot,'interface/text/mission/single'),'interface/text/mission/single/');
 function read(root,file){const target=catalogPath(root,file);if(!normalize(fs.realpathSync(target)).startsWith(normalize(fs.realpathSync(root)+path.sep)))throw new Error('Catalog symlink leaves locale root');return fs.readFileSync(target,'utf8');}
 const scriptIds=new Set();for(const s of ledger.scripts){if(scriptIds.has(s.id))throw new Error('Duplicate script ID');scriptIds.add(s.id);if(!/^[a-f0-9]{64}$/.test(s.sha256)||s.bytes<0)issues.push({scriptId:s.id,type:'invalid-script-fingerprint'});}
 for(const f of ledger.catalogs){if(typeof f.file!=='string'||!f.file.startsWith('interface/text/mission/single/'))throw new Error('Invalid mission catalog path');if(sourceFiles.has(f.file))throw new Error('Duplicate mission catalog');sourceFiles.add(f.file);
  const enText=read(enRoot,f.file),ptText=read(ptRoot,f.file);
  for(const [text,key]of[[enText,'englishSha256'],[ptText,'portugueseSha256']])if(crypto.createHash('sha256').update(text).digest('hex')!==f[key])issues.push({file:f.file,type:'catalog-baseline-changed',locale:key});
  const en=parseCatalog(enText,f.file,{tolerant:true}).filter(e=>!e.header),pt=parseCatalog(ptText,f.file,{tolerant:true}).filter(e=>!e.header);const seen=new Set();
  for(const e of en){const source=effectiveSource(e),key=JSON.stringify([e.msgctxt,sourceSignature(e),source]);if(seen.has(key))continue;seen.add(key);associations++;const a=associate(en,pt,e.msgctxt,source,f.file);if(a.matches.length!==1)issues.push({file:f.file,context:e.msgctxt,type:'catalog-association-not-unique'});}
  for(const c of f.callers??[]){const candidates=[...new Map(en.filter(e=>e.msgctxt===c.context&&crypto.createHash('sha256').update(effectiveSource(e)).digest('hex')===c.sourceHash).map(e=>[JSON.stringify([sourceSignature(e),effectiveSource(e)]),e])).values()];if(candidates.length!==1)issues.push({file:f.file,context:c.context,type:'caller-source-not-unique'});else{const e=candidates[0],signature=sourceSignature(e);if(c.sourceSignatureHash!==crypto.createHash('sha256').update(signature).digest('hex'))issues.push({file:f.file,context:c.context,type:'caller-source-signature-mismatch'});const a=associate(en,pt,c.context,effectiveSource(e),f.file);if(a.matches.length!==1||crypto.createHash('sha256').update(a.matches[0]?.translations.msgstr??'').digest('hex')!==c.translationHash)issues.push({file:f.file,context:c.context,type:'caller-translation-hash-mismatch'});}if(!ledger.scripts.some(s=>s.id===c.scriptId&&s.sha256===c.scriptSha256))issues.push({file:f.file,context:c.context,type:'caller-script-fingerprint-absent'});if(!Number.isInteger(c.line)||c.line<1)issues.push({file:f.file,context:c.context,type:'invalid-caller-line'});}
 }
 for(const f of ledger.catalogs)for(const c of f.callers??[]){const s=ledger.scripts.find(s=>s.id===c.scriptId);if(s?.totalLines!==undefined&&c.line>s.totalLines)issues.push({file:f.file,context:c.context,type:'caller-line-outside-script'});}
 for(const file of expectedFiles)if(!sourceFiles.has(file))issues.push({file,type:'mission-catalog-not-in-ledger'});for(const file of sourceFiles)if(!expectedFiles.has(file))issues.push({file,type:'ledger-catalog-outside-real-mission-inventory'});
 if(ledger.coverage?.catalogs!==sourceFiles.size||ledger.coverage?.associations!==associations)issues.push({type:'coverage-count-mismatch'});
 return{catalogs:sourceFiles.size,associations,issues,steamRequired:false,scriptValidation:'Stored fingerprints and references only; raw native script availability is not required for CI.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args[0]!=='--check'||args.length>2)throw new Error('Use: node tools/mission-context.mjs --check [ledger.json]');const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const file=path.resolve(repo,args[1]??'translation/mission-context-review-2026-10-13.json');const result=validateMissionContextLedger(JSON.parse(fs.readFileSync(file,'utf8')),repo);console.log(JSON.stringify(result,null,2));if(result.issues.length)process.exitCode=1;
}
