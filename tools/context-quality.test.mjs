import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateContextRules,checkContextQuality,validateContextManifest} from './context-quality.mjs';
const entry=(ctx,src,tr)=>`msgctxt ${JSON.stringify(ctx)}\nmsgid ${JSON.stringify(src)}\nmsgstr ${JSON.stringify(tr)}\n\n`;
const rule=(context,source,translation)=>({context,source,translation,reason:'Sentido conferido pelo contexto.'});

test('same original may have different meanings in different contexts',()=>{
 const en=entry('combat','Free for All','')+entry('experience','Free for All','');
 const pt=entry('combat','Free for All','Todos contra Todos')+entry('experience','Free for All','Todos');
 assert.deepEqual(validateContextRules(en,pt,[rule('combat','Free for All','Todos contra Todos'),rule('experience','Free for All','Todos')]),[]);
 const bad=entry('combat','Free for All','Todos contra Todos')+entry('experience','Free for All','Todos contra Todos');
 assert.equal(validateContextRules(en,bad,[rule('experience','Free for All','Todos')]).length,1);
});
test('context alone never identifies an entry',()=>{
 const en=entry('item','Rifle','')+entry('item','Tank','');
 const pt=entry('item','Rifle','Fuzil')+entry('item','Tank','Tanque');
 assert.deepEqual(validateContextRules(en,pt,[rule('item','Tank','Tanque')]),[]);
});
test('source changes require contextual rereview instead of silent substitution',()=>{
 assert.equal(validateContextRules(entry('unit','Tank crew',''),entry('unit','Tank crew','Tripulante'),[rule('unit','Weapon crew','Guarnição')]).length,1);
});
test('missing and duplicate translations cannot silently pass',()=>{
 const en=entry('unit','Tank',''),r=[rule('unit','Tank','Tanque')];
 assert.equal(validateContextRules(en,'',r).length,1);
 assert.equal(validateContextRules(en,entry('unit','Tank','Tanque').repeat(2),r).length,1);
});
test('English source in msgstr supports legacy empty msgid',()=>{
 assert.deepEqual(validateContextRules(entry('unit','','Tank'),entry('unit','','Tanque'),[rule('unit','Tank','Tanque')]),[]);
});

test('real errors_helper legacy source accepts its explicit Portuguese msgid',()=>{
 const ctx='mission/single/nodifficulty_error',src='Warning - Difficulty not detected!',tr='Aviso - Dificuldade não detectada!';
 assert.deepEqual(validateContextRules(entry(ctx,'',src),entry(ctx,src,tr),[rule(ctx,src,tr)]),[]);
});

test('different effective English sources sharing empty msgid cannot use an indistinguishable translation',()=>{
 const en=entry('unit','','Tank')+entry('unit','','Weapon');
 const result=validateContextRules(en,entry('unit','','Tanque'),[rule('unit','Tank','Tanque')]);
 assert.equal(result.length,1);
 assert.match(result[0].message,/msgid vazio/);
 assert.deepEqual(validateContextRules(en,entry('unit','Tank','Tanque')+entry('unit','Weapon','Arma'),[rule('unit','Tank','Tanque'),rule('unit','Weapon','Arma')]),[]);
});

test('an explicit legacy key does not conceal duplicate equivalent Portuguese entries',()=>{
 const en=entry('unit','','Tank'),pt=entry('unit','','Tanque')+entry('unit','Tank','Tanque');
 assert.equal(validateContextRules(en,pt,[rule('unit','Tank','Tanque')]).length,1);
});

test('identical English duplicates and broken unused English msgstr remain tolerable',()=>{
 const pt=entry('unit','Tank','Tanque'),r=[rule('unit','Tank','Tanque')];
 assert.deepEqual(validateContextRules(entry('unit','Tank','').repeat(2),pt,r),[]);
 assert.deepEqual(validateContextRules(entry('unit','','Tank').repeat(2),entry('unit','','Tanque'),r),[]);
 const broken='msgctxt "unit"\nmsgid "Tank"\nmsgstr ""4\n';
 assert.deepEqual(validateContextRules(broken,pt,r),[]);
});

test('duplicate Portuguese msgstr and unrecognized syntax cannot silently pass',()=>{
 const en=entry('unit','Tank',''),r=[rule('unit','Tank','Tanque')];
 for(const pt of [
  'msgctxt "unit"\nmsgid "Tank"\nmsgstr "Tanque"\nmsgstr "Tanque"\n',
  'msgctxt "unit"\nmsgid "Tank"\nmsgstr "Errado"\nmsgstr "Tanque"\n',
  entry('unit','Tank','Tanque').trim()+'\njunk\n'
 ])assert.ok(validateContextRules(en,pt,r).some(issue=>/Sintaxe inválida/.test(issue.message)));
});
test('duplicate, incomplete and plural rules are rejected',()=>{
 const en=entry('unit','Tank',''),pt=entry('unit','Tank','Tanque'),r=rule('unit','Tank','Tanque');
 assert.throws(()=>validateContextRules(en,pt,[r,r]),/Duplicate/);
 assert.throws(()=>validateContextRules(en,pt,[{...r,reason:''}]),/Incomplete/);
 const plural='msgctxt "unit"\nmsgid "Tank"\nmsgid_plural "Tanks"\nmsgstr[0] "Tanque"\n';
 assert.throws(()=>validateContextRules(plural,plural,[r]),/Plural/);
});
test('tags and positional printf arguments in decisions must be valid',()=>{
 const src='<c(abc)>%s %d';
 assert.throws(()=>validateContextRules(entry('a',src,''),entry('a',src,src),[rule('a',src,'%s %d')]),/protected tokens/);
 assert.throws(()=>validateContextRules(entry('a',src,''),entry('a',src,src),[rule('a',src,'<c(abc)>%d %s')]),/protected tokens/);
});
test('only applied, nonempty manifests and safe catalog paths are accepted',()=>{
 assert.throws(()=>checkContextQuality('.', {schemaVersion:1,status:'proposal-only',rules:[]}),/applied/);
 assert.throws(()=>checkContextQuality('.', {schemaVersion:1,status:'applied',rules:[{file:'../escape.pot'}]}),/Unsafe/);
});

test('declared contextual coverage counts cannot exceed or contradict the actual rules',()=>{
 const manifest={schemaVersion:1,status:'applied',rules:[rule('unit','Tank','Tanque')],changeCount:1,retainedSentinelCount:0,regressionRuleCount:1};
 assert.equal(validateContextManifest(manifest),manifest);
 for(const invalid of [{regressionRuleCount:2},{changeCount:2},{retainedSentinelCount:1},{changeCount:0.5},{changeCount:undefined}]) {
  assert.throws(()=>validateContextManifest({...manifest,...invalid}),/counts/);
 }
 assert.equal(validateContextManifest({schemaVersion:1,status:'applied',rules:manifest.rules}).rules.length,1);
});
