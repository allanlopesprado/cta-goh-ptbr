import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog,matchCatalogTranslation,actionableCatalogSyntax,protectedTokens,printfArguments} from './translation-audit.mjs';
import {catalogPath} from './apply-context-review.mjs';

const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// These are contextual regression cases, not a universal word-replacement list
// and not a claim that automated tests certify the meaning of every sentence.
export function validateContextRules(englishText,portugueseText,rules,filename='<catalog>') {
 const en=parseCatalog(englishText,filename,{tolerant:true}).filter(e=>!e.header);
 const pt=parseCatalog(portugueseText,filename,{tolerant:true}).filter(e=>!e.header);
 const issues=[],seen=new Set();
 for(const rule of rules) {
  if(!['context','source','translation','reason'].every(k=>typeof rule[k]==='string')||!rule.reason.trim())throw new Error('Incomplete contextual rule: '+filename);
  const key=JSON.stringify([rule.context,rule.source]);
  if(seen.has(key))throw new Error('Duplicate contextual rule: '+filename+': '+rule.context);
  seen.add(key);
  const fail=message=>issues.push({file:filename,context:rule.context,source:rule.source,message});
  const {signature,matches:translations,ambiguousEmptySource}=matchCatalogTranslation(en,pt,rule.context,rule.source);
  if(signature===undefined){fail('Original ausente ou ambíguo: revisar a decisão para esta versão.');continue;}
  if(ambiguousEmptySource&&translations.length===0){fail('Fontes inglesas distintas sob msgid vazio: exigir fonte explícita no catálogo português.');continue;}
  if(translations.length!==1){fail('Tradução ausente ou ambígua.');continue;}
  const entry=translations[0];
  if(entry.msgid_plural!==undefined||Object.keys(entry.translations).some(k=>k!=='msgstr'))throw new Error('Plural contextual rules need explicit forms: '+filename);
  if(!equal(protectedTokens(rule.source),protectedTokens(rule.translation))||!equal(printfArguments(rule.source),printfArguments(rule.translation)))throw new Error('Invalid protected tokens in contextual rule: '+filename+': '+rule.context);
  if(entry.translations.msgstr!==rule.translation)fail('A tradução diverge da decisão contextual registrada.');
  if(entry.syntaxErrors.some(actionableCatalogSyntax))fail('Sintaxe inválida na tradução protegida.');
 }
 return issues;
}

export function validateContextManifest(manifest) {
 if(manifest.schemaVersion!==1||manifest.status!=='applied'||!Array.isArray(manifest.rules)||manifest.rules.length===0)throw new Error('Expected applied contextual decisions, schemaVersion 1.');
 const counts=['changeCount','retainedSentinelCount','regressionRuleCount'];
 if(counts.some(key=>Object.hasOwn(manifest,key))&&(
  !counts.every(key=>Number.isSafeInteger(manifest[key])&&manifest[key]>=0)||
  manifest.regressionRuleCount!==manifest.rules.length||
  manifest.changeCount+manifest.retainedSentinelCount!==manifest.rules.length
 ))throw new Error('Contextual manifest counts do not match its rules.');
 return manifest;
}

export function checkContextQuality(repo,manifest) {
 validateContextManifest(manifest);
 const groups=new Map();
 for(const rule of manifest.rules) {
  catalogPath(path.resolve(repo,'localization/pt_BR'),rule.file);
  if(!groups.has(rule.file))groups.set(rule.file,[]);
  groups.get(rule.file).push(rule);
 }
 const read=(locale,file)=>{
  const root=path.resolve(repo,'localization',locale),target=catalogPath(root,file);
  const normalize=value=>process.platform==='win32'?value.toLowerCase():value;
  if(!normalize(fs.realpathSync(target)).startsWith(normalize(fs.realpathSync(root)+path.sep)))throw new Error('Catalog symlink leaves locale root: '+file);
  return fs.readFileSync(target,'utf8');
 };
 const issues=[];
 for(const [file,rules] of groups)issues.push(...validateContextRules(read('en',file),read('pt_BR',file),rules,file));
 return {rules:manifest.rules.length,files:groups.size,issues};
}

function main(){
 const args=process.argv.slice(2),repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 if(args.some(a=>a!=='--check'))throw new Error('Use: node tools/context-quality.mjs --check');
 const manifest=JSON.parse(fs.readFileSync(path.join(repo,'translation/context-quality.json'),'utf8'));
 const result=checkContextQuality(repo,manifest);
 console.log(JSON.stringify(result,null,2));
 if(result.issues.length)process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
