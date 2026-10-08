import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {planCatalogChanges,catalogPath} from './apply-context-review.mjs';
const entry=(ctx,src,tr,eol='\n')=>`msgctxt ${JSON.stringify(ctx)}${eol}msgid ${JSON.stringify(src)}${eol}msgstr ${JSON.stringify(tr)}${eol}${eol}`;
const change=(source,before,after,context='test')=>({context,source,before,after,reason:'Context confirmed'});
test('catalog paths reject traversal, absolute paths and foreign separators',()=>{
 const root=path.resolve('fixture/pt_BR');
 assert.equal(catalogPath(root,'interface/text/mission/single/01-test.pot'),path.join(root,'interface/text/mission/single/01-test.pot'));
 for(const file of ['interface/text/../../../../escape.pot','interface/text/./escape.pot','../escape.pot','C:/escape.pot','/escape.pot','interface\\text\\escape.pot'])assert.throws(()=>catalogPath(root,file),/Unsafe catalog path/);
});
test('same context with different original must not overwrite another entry',()=>{
 const en=entry('test','Rifle','Rifle')+entry('test','Tank','Tank');
 const pt=entry('test','Rifle','Rifle')+entry('test','Tank','Tanque');
 const p=planCatalogChanges(en,pt,[change('Rifle','Rifle','Fuzil')]);
 assert.equal(p.text,entry('test','Rifle','Fuzil')+entry('test','Tank','Tanque'));
});
test('original in English msgstr supports empty msgid',()=>{
 const p=planCatalogChanges(entry('test','','Unit'),entry('test','','Unidade'),[change('Unit','Unidade','Tropa')]);
 assert.equal(p.text,entry('test','','Tropa'));
});

test('real errors_helper English fallback pairs with an explicit Portuguese source',()=>{
 const ctx='mission/single/nodifficulty_error',src='Warning - Difficulty not detected!',before='Aviso - Dificuldade não detectada!',after='Aviso: dificuldade não detectada!';
 const p=planCatalogChanges(entry(ctx,'',src),entry(ctx,src,before),[change(src,before,after,ctx)]);
 assert.equal(p.text,entry(ctx,src,after));
});

test('indistinguishable empty sources never overwrite another legacy translation',()=>{
 const en=entry('test','','Tank')+entry('test','','Weapon');
 assert.throws(()=>planCatalogChanges(en,entry('test','','Arma'),[change('Tank','Arma','Tanque')]),/ambiguous legacy/);
 const pt=entry('test','Tank','Tanque')+entry('test','Weapon','Arma');
 const p=planCatalogChanges(en,pt,[change('Tank','Tanque','Blindado'),change('Weapon','Arma','Armamento')]);
 assert.equal(p.text,entry('test','Tank','Blindado')+entry('test','Weapon','Armamento'));
});

test('identical English duplicates and unused malformed English msgstr do not block exact changes',()=>{
 const pt=entry('test','Tank','Tanque'),changes=[change('Tank','Tanque','Blindado')];
 assert.equal(planCatalogChanges(entry('test','Tank','').repeat(2),pt,changes).changes,1);
 assert.equal(planCatalogChanges(entry('test','','Tank').repeat(2),entry('test','','Tanque'),changes).changes,1);
 const broken='msgctxt "test"\nmsgid "Tank"\nmsgstr ""4\n';
 assert.equal(planCatalogChanges(broken,pt,changes).changes,1);
});

test('duplicate Portuguese msgstr or unknown syntax cannot be repaired implicitly by a patch',()=>{
 const en=entry('test','Tank',''),changes=[change('Tank','Tanque','Blindado')];
 for(const pt of [
  'msgctxt "test"\nmsgid "Tank"\nmsgstr "Tanque"\nmsgstr "Tanque"\n',
  'msgctxt "test"\nmsgid "Tank"\nmsgstr "Tanque"\nmsgstr "Errado"\n',
  entry('test','Tank','Tanque').trim()+'\njunk\n'
 ])assert.throws(()=>planCatalogChanges(en,pt,changes),/invalid Portuguese catalog syntax/);
});
test('stale translation is rejected',()=>assert.throws(()=>planCatalogChanges(entry('test','Tank','Tank'),entry('test','Tank','Tanque'),[change('Tank','Blindado','Veículo')] ),/changed since review/));
test('missing tag is rejected',()=>assert.throws(()=>planCatalogChanges(entry('test','<c(abc)>Tank',''),entry('test','<c(abc)>Tank','<c(abc)>Tanque'),[change('<c(abc)>Tank','<c(abc)>Tanque','Tanque')] ),/token mismatch/));
test('printf argument order cannot change',()=>assert.throws(()=>planCatalogChanges(entry('test','%s %d',''),entry('test','%s %d','%s %d'),[change('%s %d','%s %d','%d %s')] ),/printf order/));
test('comments, headers, source and CRLF survive verbatim',()=>{
 const pt='# translator comment\r\n'+entry('test','Tank','Tanque','\r\n')+'# footer\r\n';
 assert.equal(planCatalogChanges(entry('test','Tank',''),pt,[change('Tank','Tanque','Carro de combate')]).text,'# translator comment\r\n'+entry('test','Tank','Carro de combate','\r\n')+'# footer\r\n');
});
test('multiline msgstr replaced without disturbing adjacent entries',()=>{
 const pt='msgctxt "test"\nmsgid "Long text"\nmsgstr "Texto "\n"longo"\n\n'+entry('other','Other','Outro');
 const p=planCatalogChanges(entry('test','Long text','')+entry('other','Other',''),pt,[change('Long text','Texto longo','Texto revisado')]);
 assert.equal(p.text,entry('test','Long text','Texto revisado')+entry('other','Other','Outro'));
});
test('duplicate proposals and plural changes are rejected',()=>{
 const c=change('Tank','Tanque','Blindado');
 assert.throws(()=>planCatalogChanges(entry('test','Tank',''),entry('test','Tank','Tanque'),[c,c]),/duplicate proposed/);
 const en='msgctxt "test"\nmsgid "Tank"\nmsgid_plural "Tanks"\nmsgstr[0] ""\n';
 const pt='msgctxt "test"\nmsgid "Tank"\nmsgid_plural "Tanks"\nmsgstr[0] "Tanque"\n';
 assert.throws(()=>planCatalogChanges(en,pt,[c]),/plural changes/);
});
