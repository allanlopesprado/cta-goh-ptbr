import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseCatalog, matchCatalogTranslation, actionableCatalogSyntax, sourceSignature, protectedTokens, printfArguments} from './translation-audit.mjs';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function catalogPath(root,file) {
 if(!/^interface\/text\/(?:[\w.-]+\/)*[\w.-]+\.pot$/.test(file) || file.split('/').some(segment=>segment==='.'||segment==='..')) throw new Error('Unsafe catalog path: '+file);
 const absoluteRoot=path.resolve(root), target=path.resolve(absoluteRoot,file);
 const normalize=value=>process.platform==='win32'?value.toLowerCase():value;
 if(!normalize(target).startsWith(normalize(absoluteRoot+path.sep)))throw new Error('Catalog path leaves locale root: '+file);
 return target;
}
function assertRealContained(root,target) {
 const normalize=value=>process.platform==='win32'?value.toLowerCase():value;
 if(!normalize(fs.realpathSync(target)).startsWith(normalize(fs.realpathSync(root)+path.sep)))throw new Error('Catalog symlink leaves locale root: '+target);
}

// Plan first; this function never writes. Context alone is not a safe entry key.
export function planCatalogChanges(englishText, portugueseText, changes, filename='<catalog>') {
 const en = parseCatalog(englishText,filename,{tolerant:true}).filter(e=>!e.header);
 const pt = parseCatalog(portugueseText,filename,{tolerant:true});
 const patches=[], seen=new Set();
 for(const change of changes) {
  if(!['context','source','before','after','reason'].every(k=>typeof change[k]==='string') || !change.reason.trim()) throw new Error(filename+': incomplete change');
  const {signature,matches,ambiguousEmptySource}=matchCatalogTranslation(en,pt,change.context,change.source);
  if(signature===undefined) throw new Error(filename+': missing/ambiguous English source: '+change.context);
  if(ambiguousEmptySource&&matches.length===0) throw new Error(filename+': ambiguous legacy English sources require an explicit Portuguese source: '+change.context);
  if(matches.length!==1) throw new Error(filename+': missing/ambiguous Portuguese entry: '+change.context);
  const entry=matches[0];
  const key=JSON.stringify([change.context,sourceSignature(entry)]);
  if(seen.has(key)) throw new Error(filename+': duplicate proposed change: '+change.context);
  seen.add(key);
  if(entry.syntaxErrors.some(actionableCatalogSyntax)) throw new Error(filename+': invalid Portuguese catalog syntax: '+change.context);
  if(entry.msgid_plural!==undefined || Object.keys(entry.translations).some(k=>k!=='msgstr')) throw new Error(filename+': plural changes require an explicit plural review');
  if(entry.translations.msgstr!==change.before) throw new Error(filename+': translation changed since review: '+change.context);
  if(change.before===change.after) throw new Error(filename+': no-op change: '+change.context);
  if(!equal(protectedTokens(change.source),protectedTokens(change.after))) throw new Error(filename+': protected token mismatch: '+change.context);
  if(!equal(printfArguments(change.source),printfArguments(change.after))) throw new Error(filename+': printf order mismatch: '+change.context);
  const span=entry.spans.msgstr;
  if(!span) throw new Error(filename+': singular msgstr missing');
  const raw=portugueseText.slice(span.start,span.end);
  const ending=raw.endsWith('\r\n')?'\r\n':raw.endsWith('\n')?'\n':'';
  patches.push({start:span.start,end:span.end,text:'msgstr '+JSON.stringify(change.after)+ending,entry,change});
 }
 let text=portugueseText;
 for(const patch of [...patches].sort((a,b)=>b.start-a.start)) text=text.slice(0,patch.start)+patch.text+text.slice(patch.end);
 const result=parseCatalog(text,filename,{tolerant:true});
 if(result.length!==pt.length) throw new Error(filename+': entry count changed');
 for(let i=0;i<pt.length;i++) {
  const before=pt[i], after=result[i];
  if(before.msgctxt!==after.msgctxt || sourceSignature(before)!==sourceSignature(after) || before.header!==after.header) throw new Error(filename+': non-translation field changed');
  const patch=patches.find(p=>p.entry===before);
  if(patch) {
   if(after.translations.msgstr!==patch.change.after || after.syntaxErrors.some(actionableCatalogSyntax)) throw new Error(filename+': invalid replacement');
  } else if(!equal(before.translations,after.translations)) throw new Error(filename+': unplanned translation change');
 }
 return {text,changes:patches.length,beforeSha256:sha256(portugueseText),afterSha256:sha256(text)};
}

export function planReview(repo,report) {
 const ptRoot=path.resolve(repo,'localization/pt_BR'), enRoot=path.resolve(repo,'localization/en');
 const groups=new Map();
 for(const change of report.changes) {
  catalogPath(ptRoot,change.file);
  if(!groups.has(change.file)) groups.set(change.file,[]);
  groups.get(change.file).push(change);
 }
 const records=new Map(report.files.map(f=>[f.file,f]));
 const plans=[];
 for(const [file,changes] of groups) {
  const target=catalogPath(ptRoot,file), source=catalogPath(enRoot,file);
  assertRealContained(ptRoot,target);assertRealContained(enRoot,source);
  const en=fs.readFileSync(source,'utf8');
  const pt=fs.readFileSync(target,'utf8');
  const record=records.get(file);
  if(!record || record.sourceSha256!==sha256(en) || record.translationBeforeSha256!==sha256(pt)) throw new Error(file+': catalog hash does not match review baseline');
  plans.push({file,target,...planCatalogChanges(en,pt,changes,file)});
 }
 return plans;
}

function main() {
 const args=process.argv.slice(2);
 const get=flag=>args[args.indexOf(flag)+1];
 if(!args.includes('--manifest') || !args.includes('--repo')) throw new Error('Use --repo PATH --manifest PATH [--apply]. Default is read-only validation.');
 const repo=path.resolve(get('--repo'));
 const report=JSON.parse(fs.readFileSync(path.resolve(get('--manifest')),'utf8'));
 const plans=planReview(repo,report);
 // Recheck every destination before writing any file.
 if(args.includes('--apply')) {
  for(const p of plans) if(sha256(fs.readFileSync(p.target,'utf8'))!==p.beforeSha256) throw new Error('Concurrent change: '+p.file);
  for(const p of plans) fs.writeFileSync(p.target,p.text,'utf8');
 }
 console.log(JSON.stringify({mode:args.includes('--apply')?'applied':'validated-only',changedFiles:plans.length,changes:plans.reduce((n,p)=>n+p.changes,0)},null,2));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
