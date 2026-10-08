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
