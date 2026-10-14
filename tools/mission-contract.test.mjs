import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkMissionContract,collectMissionCatalogs,contractKindsFor,hash,missionContractProofFingerprint,readJson,safeRelative} from './mission-contract.mjs';

const FILE='interface/text/mission/single/00-bootcamp/fixture.pot';
const CTX='mission/single/00-bootcamp/fixture';
const STRINGS=[
 [CTX+'/task1',"Don't raise the alarm!",'Não deixe que o inimigo dê o alarme!'],
 [CTX+'/task2','At least 5 trucks must survive.','Pelo menos 5 caminhões devem sobreviver.'],
 [CTX+'/ui/obj_progress','%1% more Enemies to eliminate using Fire Damage','%1% Inimigos restantes a eliminar com Dano de Fogo'],
 [CTX+'/task4','Destroy the enemy AT guns using the Cromwell IV.','Destrua os canhões AT inimigos usando o Cromwell IV.']
];
const pot=(strings,pt)=>strings.map(([context,en,target])=>`msgctxt ${JSON.stringify(context)}\nmsgid ${JSON.stringify(en)}\nmsgstr ${JSON.stringify(pt?target:'')}\n`).join('\n');
function fixture({includeBlank=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cta-mission-contract-'));
 for(const relative of ['localization/en/'+FILE,'localization/pt_BR/'+FILE,'localization/en/interface/text/desc/dummy.pot'])fs.mkdirSync(path.dirname(path.join(root,relative)),{recursive:true});
 const strings=includeBlank?[...STRINGS,[CTX+'/mission_fail','','']]:STRINGS;
 fs.writeFileSync(path.join(root,'localization/en/'+FILE),pot(strings,false));fs.writeFileSync(path.join(root,'localization/pt_BR/'+FILE),pot(strings,true));fs.writeFileSync(path.join(root,'localization/en/interface/text/desc/dummy.pot'),pot([['desc/dummy','Dummy','']],false));
 const actual=collectMissionCatalogs(root,[]),file=actual.catalogs[0];
 const script={id:'fixture.pak::single/00-bootcamp/fixture/0.mi',archive:'fixture.pak',entry:'single/00-bootcamp/fixture/0.mi',missionContext:CTX,sha256:'a'.repeat(64),bytes:1000,totalLines:100,blocks:1,entities:1,edges:1};
 const publicCallers=actual.pairs.map((p,i)=>({id:p.id,context:p.context,sourceHash:p.sourceHash,sourceSignatureHash:p.sourceSignatureHash,translationHash:p.translationHash,scriptId:script.id,scriptSha256:script.sha256,line:20+i,field:'desc',command:null,ownerId:'trigger:fixture@10',disabled:false,executionStatus:'unmarked-runtime-not-certified'}));
 const rows=actual.pairs.filter(p=>p.contractKinds.length).map((p,i)=>({pairId:p.id,file:p.file,context:p.context,english:p.source,portuguese:p.translation,sourceSignature:p.sourceSignature,sourceHash:p.sourceHash,translationHash:p.translationHash,contractKinds:p.contractKinds,isObjectiveOrHintContext:p.isObjectiveOrHintContext,decision:i===0?'see-manual-decision':'retain-source-review-with-structural-reference',manualDecisionId:i===0?'alarm':null,proofLevel:i===0?'manual-record-specific-level':'exact-reference-only-not-runtime-contract',nativeCallers:[{scriptId:script.id,scriptSha256:script.sha256,line:publicCallers[i].line,field:null,command:null,ownerId:publicCallers[i].ownerId,disabled:false,executionStatus:'unmarked-runtime-not-certified',sourceMatchesCurrent:true,translationMatchesCurrent:true,nativeIndexTranslationHash:p.translationHash,currentTranslationHash:p.translationHash}]}));
 const{nativeCallers,...manualPair}=rows[0];
 const review={schemaVersion:1,scope:{gameExecuted:false,audioHeard:false},coverage:[{file:FILE,sourcePath:'localization/en/'+FILE,targetPath:'localization/pt_BR/'+FILE,sourceSha256:file.englishSha256,targetSha256:file.portugueseSha256,logicalEntries:4,physicalEnglishEntries:4,physicalPortugueseEntries:4,criticalCandidates:4,objectiveOrHintCandidates:4,withExactNativeReference:4,manualDecisionPairs:[rows[0].pairId],candidateIds:rows.map(r=>r.pairId)}],decisionLedger:rows,manualDecisions:[{id:'alarm',pairIds:[rows[0].pairId],pairs:[manualPair],native:[{archive:script.archive,entry:script.entry,sha256:script.sha256,callerLines:[20],evidence:[{lines:[25],fact:'The alarm is prohibited by this static fixture.'}]}],limitations:['Static fixture, not engine execution.']}],rootAdjudications:[],summary:{missionCatalogues:1,missionLogicalPairs:4,criticalCandidatePairs:4,objectiveOrHintCandidatePairs:4,manualDecisionGroups:1,manualDecisionPairs:1,rootSourceUIAdjudications:0,candidatesWithExactNativeReference:4,candidatesWithoutExactNativeReference:0,structuralCallerLinks:4,inactiveOrMarkedCallerLinks:0,associationErrors:0,emptyTargets:0,staleNativeSourceHashes:0,staleNativeTargetHashes:0},artifacts:[{file:'.translation-work/unavailable-local-evidence.json',sha256:'b'.repeat(64)}]};
 review.coverage[0].logicalEntries=strings.length;review.coverage[0].physicalEnglishEntries=strings.length;review.coverage[0].physicalPortugueseEntries=strings.length;review.summary.missionLogicalPairs=strings.length;
 const fingerprint=missionContractProofFingerprint(review);review.reconciliation={proofFingerprintBefore:fingerprint,proofFingerprintAfter:fingerprint,nativeEvidenceUnchanged:true};
 const contextReview={schemaVersion:1,coverage:{catalogs:1,associations:strings.length},scripts:[script],catalogs:[{file:FILE,englishSha256:file.englishSha256,portugueseSha256:file.portugueseSha256,logicalAssociations:strings.length,callers:publicCallers,unlinkedAssociations:[]}]};
 review.reconciliation.publicContextReferenceLedger={file:'translation/mission-context-review-2026-10-13.json',sha256:'e'.repeat(64),canonicalSha256:hash(JSON.stringify(contextReview))};
 const options={exceptions:[],expected:{catalogues:1,associations:strings.length,candidates:4,objectiveOrHintCandidates:4,rootUIAdjudications:0,proofFingerprint:fingerprint}};
 const cleanup=()=>{const resolved=fs.realpathSync(root),tempRoot=fs.realpathSync(os.tmpdir());assert.equal(path.dirname(resolved),tempRoot);assert.ok(path.basename(resolved).startsWith('cta-mission-contract-'));fs.rmSync(resolved,{recursive:true,force:true});};
 return{root,review,contextReview,options,actual,cleanup,run(){return checkMissionContract(root,review,contextReview,options);}};
}
const withFixture=fn=>{const x=fixture();try{return fn(x);}finally{x.cleanup();}};

test('public check needs only catalogues and the public ledger, not Steam or ignored evidence',()=>withFixture(x=>{assert.equal(fs.existsSync(path.join(x.root,'.translation-work')),false);const r=x.run();assert.equal(r.candidates,4);assert.equal(r.requiresSteam,false);assert.equal(r.requiresIgnoredWorkFiles,false);assert.match(r.validationLevel,/not engine execution/);}));
test('candidate context fallback catches negative alarm without matching an action regex',()=>{assert.deepEqual(contractKindsFor(CTX+'/task1',"Don't raise the alarm!"),['objective-or-hint-context']);});
test('genuinely empty English and PT entry is inventoried, not an untranslated candidate',()=>{const x=fixture({includeBlank:true});try{const result=x.run();assert.equal(result.associations,5);assert.equal(result.candidates,4);assert.equal(result.issues.length,0);}finally{x.cleanup();}});
test('generic narrative not in an objective and without critical signal is not injected into selection',()=>{assert.deepEqual(contractKindsFor(CTX+'/narrator/01','Good morning, soldier.'),[]);});
test('global English ID order includes non-mission catalogues',()=>withFixture(x=>{assert.equal(x.actual.pairs[0].id,1);x.review.decisionLedger[0].pairId=0;assert.throws(()=>x.run(),/snapshot drift/);}));

for(const[label,index,wrong]of[
 ['negative alarm polarity',0,'Dê o alarme!'],
 ['minimum replaced by maximum',1,'No máximo 5 caminhões devem sobreviver.'],
 ['remaining counter replaced by completed count',2,'%1% Inimigos já eliminados com Dano de Fogo'],
 ['vehicle model reference changed',3,'Destrua os canhões AT inimigos usando o Cromwell VI.']
])test('unreviewed target drift is blocked: '+label,()=>withFixture(x=>{const changed=structuredClone(STRINGS);changed[index][2]=wrong;fs.writeFileSync(path.join(x.root,'localization/pt_BR/'+FILE),pot(changed,true));assert.throws(()=>x.run(),/hash.*drift|snapshot drift/);}));

test('source byte and signature drift cannot reuse a file/context-only match',()=>withFixture(x=>{const changed=structuredClone(STRINGS);changed[1][1]='At most 5 trucks must survive.';fs.writeFileSync(path.join(x.root,'localization/en/'+FILE),pot(changed,false));assert.throws(()=>x.run(),/hash.*drift|identity|snapshot drift|ambiguous EN\/PT association/);}));
test('source signature mismatch fails despite equal context and English text',()=>withFixture(x=>{x.review.decisionLedger[0].sourceSignature='["different",null]';assert.throws(()=>x.run(),/snapshot drift/);}));
test('missing target catalogue fails before associations are certified',()=>withFixture(x=>{fs.unlinkSync(path.join(x.root,'localization/pt_BR/'+FILE));assert.throws(()=>x.run(),/Missing or unexpected/);}));
test('ambiguous duplicate PT entry is rejected',()=>withFixture(x=>{fs.appendFileSync(path.join(x.root,'localization/pt_BR/'+FILE),'\n'+pot([STRINGS[0]],true));assert.throws(()=>x.run(),/ambiguous EN\/PT association/);}));
test('empty PT target is rejected',()=>withFixture(x=>{const changed=structuredClone(STRINGS);changed[0][2]='';fs.writeFileSync(path.join(x.root,'localization/pt_BR/'+FILE),pot(changed,true));assert.throws(()=>x.run(),/Empty contract translation/);}));
test('missing candidate cannot be hidden by reducing the summary',()=>withFixture(x=>{x.review.decisionLedger.pop();x.review.summary.criticalCandidatePairs--;assert.throws(()=>x.run(),/Missing or extra contract candidate/);}));
test('duplicate candidate cannot substitute for missing coverage',()=>withFixture(x=>{x.review.decisionLedger.push(structuredClone(x.review.decisionLedger[0]));assert.throws(()=>x.run(),/Duplicate.*candidate selection/);}));
test('missing per-file inventory is rejected',()=>withFixture(x=>{x.review.coverage=[];assert.throws(()=>x.run(),/Missing contract catalogue coverage/);}));
test('per-file candidate counts are verified, not accepted as claims',()=>withFixture(x=>{x.review.coverage[0].criticalCandidates=3;assert.throws(()=>x.run(),/coverage\/hash drift/);}));
test('source and target hashes in entries are both checked',()=>withFixture(x=>{x.review.decisionLedger[1].translationHash='0'.repeat(64);assert.throws(()=>x.run(),/snapshot drift/);}));
test('native reference cannot switch to another script hash',()=>withFixture(x=>{x.review.decisionLedger[0].nativeCallers[0].scriptSha256='c'.repeat(64);assert.throws(()=>x.run(),/fingerprint\/flags drift/);}));
test('disabled flags cannot be promoted to execution certainty',()=>withFixture(x=>{x.review.decisionLedger[0].nativeCallers[0].disabled=true;assert.throws(()=>x.run(),/fingerprint\/flags drift/);}));
test('field unknown in frozen proof can remain unknown after a parser metadata supplement',()=>withFixture(x=>{assert.equal(x.run().issues.length,0);x.review.decisionLedger[0].nativeCallers[0].field='image';assert.throws(()=>x.run(),/Asserted caller field/);}));
test('missing native link is detected against the public context ledger',()=>withFixture(x=>{x.review.decisionLedger[0].nativeCallers=[];assert.throws(()=>x.run(),/native reference coverage/);}));
test('caller language hash in the public ledger must already match current PT',()=>withFixture(x=>{x.contextReview.catalogs[0].callers[0].translationHash='d'.repeat(64);assert.throws(()=>x.run(),/caller identity\/hash drift/);}));
test('changed native condition narrative invalidates the fixed proof fingerprint',()=>withFixture(x=>{x.review.manualDecisions[0].native[0].evidence[0].fact='The alarm must be set instead.';assert.throws(()=>x.run(),/proof\/coverage seal changed/);}));
test('manual evidence is bounded by the recorded script line count',()=>withFixture(x=>{x.review.manualDecisions[0].native[0].evidence[0].lines=[101];assert.throws(()=>x.run(),/line outside/);}));
test('structural candidates cannot be relabelled runtime-certified',()=>withFixture(x=>{x.review.decisionLedger[0].proofLevel='runtime-certified';assert.throws(()=>x.run(),/cannot imply runtime/);}));
test('static review cannot claim heard audio or game execution',()=>withFixture(x=>{x.review.scope.audioHeard=true;assert.throws(()=>x.run(),/cannot claim game\/audio/);}));
test('added/changed public context metadata must be re-anchored to reconciled provenance',()=>withFixture(x=>{x.contextReview.scripts[0].blocks=2;assert.throws(()=>x.run(),/ledger fingerprint differs/);}));
test('unsupported source/UI evidence grade is not promoted to a functional correction',()=>withFixture(x=>{const p=x.actual.pairs[0];x.review.rootAdjudications=[{pairId:p.id,file:p.file,context:p.context,source:p.source,sourceSignature:p.sourceSignature,before:p.translation,after:p.translation,decision:'applied-root-editorial-source-ui-alignment',evidenceGrade:'runtime-functional-error'}];x.options.expected.rootUIAdjudications=1;assert.throws(()=>x.run(),/evidence-grade drift/);}));
test('unsafe relative paths are rejected without reading them',()=>{for(const value of ['../secret','/outside','C:/outside','a\\b','a//b','a/./b','a/../b','a./b'])assert.throws(()=>safeRelative(value),/Unsafe relative path/);});
test('provenance artifact hashes are metadata, but paths remain constrained',()=>withFixture(x=>{x.review.artifacts[0].file='../outside';assert.throws(()=>x.run(),/Unsafe relative path/);}));
test('source directory symlink/junction is rejected',t=>withFixture(x=>{const folder=path.join(x.root,'localization/en/interface/text/mission/single/00-bootcamp'),actual=folder+'-actual';fs.renameSync(folder,actual);try{fs.symlinkSync(actual,folder,process.platform==='win32'?'junction':'dir');}catch(error){if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.skip('Directory link creation unavailable');return;}throw error;}assert.throws(()=>x.run(),/Symlink/);}));
test('public report reader rejects symlink/junction ancestors',t=>withFixture(x=>{const actual=path.join(x.root,'actual-reports'),link=path.join(x.root,'reports');fs.mkdirSync(actual);fs.writeFileSync(path.join(actual,'report.json'),'{}');try{fs.symlinkSync(actual,link,process.platform==='win32'?'junction':'dir');}catch(error){if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.skip('Directory link creation unavailable');return;}throw error;}assert.throws(()=>readJson(x.root,'reports/report.json'),/Symlink/);}));
