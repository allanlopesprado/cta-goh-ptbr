import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const auditor=fileURLToPath(new URL('./translation-audit.mjs',import.meta.url));
for(const applied of [false,true])test('final review fallback evidence is '+(applied?'accepted only after application':'rejected when only proposed'),()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cta-final-audit-test-'));
 try{
  for(const dir of ['old','localization/en','localization/pt_BR','translation'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  fs.writeFileSync(path.join(root,'old/test.pot'),'msgctxt "error"\nmsgid ""\nmsgstr "Old warning"\n');
  fs.writeFileSync(path.join(root,'localization/en/test.pot'),'msgctxt "error"\nmsgid ""\nmsgstr "New warning"\n');
  fs.writeFileSync(path.join(root,'localization/pt_BR/test.pot'),'msgctxt "error"\nmsgid ""\nmsgstr "Novo aviso"\n');
  fs.writeFileSync(path.join(root,'translation/final-review-2026-10-07.json'),JSON.stringify({application:{status:applied?'applied':'planned'},changes:[{file:'test.pot',context:'error',source:'New warning',sourceMessageId:'',sourceText:'New warning',after:'Novo aviso'}]}));
  const summary=JSON.parse(execFileSync(process.execPath,[auditor,'--repo',root,'--previous','old'],{encoding:'utf8'}));
  assert.equal(summary.counts.changed,1);
  assert.equal(summary.counts.needsTranslationReview,applied?0:1);
 }finally{
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(),'cta-final-audit-test-')));
  fs.rmSync(root,{recursive:true});
 }
});
