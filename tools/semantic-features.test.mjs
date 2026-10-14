import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkSemanticFeatures, checkCatalogSemanticFeatures, checkSemanticRoot} from './semantic-features.mjs';
const file = 'interface/text/desc/desc_squad_doctrines_eng.pot';
const check = (source, translation, filename = file) => checkSemanticFeatures({file: filename, context: 'test', source, translation});
const entry = (source, translation) => 'msgctxt "test"\nmsgid ' + JSON.stringify(source) + '\nmsgstr ' + JSON.stringify(translation) + '\n';

test('AT Rifleman accepts different PT sentence structures preserving the weapon', () => {
 for (const target of ['Atirador com Fuzil Antitanque', 'Sapador de Assalto com Fuzil Antitanque [KA]', 'Atirador de fuzil antitanque', 'Atirador com fuzil anticarro', 'Atirador com Fuzil AT'])
  assert.deepEqual(check('Assault Sapper AT Rifleman [KA]', target).issues, []);
});
test('AT Rifleman catches omitted weapon and generic AT substitutions', () => {
 for (const target of ['Sapador de Assalto AT Atirador', 'Infantaria Antitanque', 'Atirador de precisão'])
  assert.equal(check('AT Rifleman', target).issues[0].type, 'anti-tank-rifle-role');
});
test('AT Infantry and unrelated marksmen are not forced into AT rifle wording', () => {
 assert.deepEqual(check('AT Infantry', 'Infantaria Antitanque').features, []);
 assert.deepEqual(check('Rifleman', 'Fuzileiro').features, []);
});
test('inch safeguard permits full or abbreviated PT and decimal comma', () => {
 for (const target of ['Morteiro de 4.2 pol.', 'Morteiro de 4,2 pol.', 'Morteiro de 4.2 polegadas'])
  assert.deepEqual(check('4.2-inch Mortar', target).issues, []);
});
test('inch safeguard catches leftover English, converted calibre and missing unit', () => {
 for (const target of ['4.2-inch Morteiro', 'Morteiro de 107mm', 'Morteiro 4.2'])
  assert.ok(check('4.2-inch Mortar', target).issues.some(i => i.type === 'nominal-inch-calibre'));
});
test('a suffix of a different number cannot satisfy a nominal calibre', () => {
 assert.ok(check('4.2-inch Mortar', 'Morteiro 14.2 pol.').issues.length);
});
test('leading-dot calibres are not misread as integer inches', () => {
 assert.deepEqual(check('.5-inch Heavy MG', 'MG Pesada .5 pol.').issues, []);
 assert.deepEqual(check('.5-inch Heavy MG', 'MG Pesada 0,5 pol.').issues, []);
 assert.deepEqual(check('4.2-inch Mortar', 'Morteiro de 4,20 pol.').issues, []);
 assert.ok(check('.5-inch Heavy MG', 'MG Pesada 5 pol.').issues.length);
});
test('normalization never rounds a different calibre to the intended value', () => {
 assert.ok(check('4.2-inch Mortar', 'Morteiro de 4,2001 pol.').issues.length);
 assert.ok(check('.5-inch Heavy MG', 'MG Pesada 0,5000000000000001 pol.').issues.length);
});
test('source units without separators and uppercase Inch remain protected', () => {
 assert.deepEqual(check('QF 4.5inch Howitzer', 'Obuseiro QF 4.5 pol.').issues, []);
 assert.deepEqual(check('BL 6-Inch Gun', 'Canhão BL 6 pol.').issues, []);
 assert.ok(check('QF 4.5inch Howitzer', 'Obuseiro QF 4.5inch').issues.some(i => i.type === 'untranslated-inch-unit'));
});
test('audited skirmish equipment menus are protected without converting mission dialogue', () => {
 const pair = {file: 'interface/text/mission/single/0x-skirmish/reinf_eng.pot', context: 'mission/single/0x-skirmish/menu_eng/81mm_ml3', source: 'ML 3-inch Mortar', translation: 'Morteiro ML 3-inch'};
 assert.ok(checkSemanticFeatures(pair).issues.length);
 assert.deepEqual(checkSemanticFeatures({...pair, translation: 'Morteiro ML 3 pol.'}).issues, []);
});
test('multiple source calibres are individually protected', () => {
 assert.deepEqual(check('3-inch / 4.2-inch Mortars', 'Morteiros de 3 pol. e 4.2 pol.').issues, []);
 assert.equal(check('3-inch / 4.2-inch Mortars', 'Morteiros de 4.2 pol.').issues.filter(i => i.type === 'nominal-inch-calibre').length, 1);
 assert.equal(check('3-inch / 3-inch Mortars', 'Morteiros de 3 pol.').issues.filter(i => i.type === 'nominal-inch-calibre').length, 1);
});
test('model codes and ton designations are not altered by inch safeguards', () => {
 assert.deepEqual(check('Ford 3-Ton', 'Ford 3-Ton').features, []);
 assert.deepEqual(check('BL 6-inch 26-cwt Howitzer Mk.I', 'Obuseiro BL 6 pol. 26-cwt Mk.I').issues, []);
});
test('quoted expressions outside item descriptions are not forced into calibre notation', () => {
 assert.deepEqual(check('Not one inch!', 'Nem um centímetro!', 'interface/text/mission/single/test/test.pot').features, []);
});
test('catalog association diagnoses missing targets rather than testing another context', () => {
 const result = checkCatalogSemanticFeatures(entry('AT Rifleman', 'AT Rifleman'), '', file);
 assert.equal(result.issues[0].type, 'semantic-feature-association');
});
test('physical key safeguards do not translate menu actions or guess BACKSPACE', () => {
 const pair = {file: 'interface/text/dlg_frontend.pot', context: 'options/keys/keymap/key_home', source: 'HOME', translation: 'HOME'};
 assert.deepEqual(checkSemanticFeatures(pair).issues, []);
 assert.ok(checkSemanticFeatures({...pair, translation: 'INÍCIO'}).issues.length);
 assert.deepEqual(checkSemanticFeatures({...pair, context: 'main_menu/home', translation: 'INÍCIO'}).features, []);
 assert.ok(checkSemanticFeatures({...pair, context: 'options/keys/keymap/key_back', source: 'BACK', translation: 'BACKSPACE'}).issues.length);
});
test('fuel safeguards reject crew labels without pretending to prove container direction', () => {
 const pair = {file: 'interface/text/dlg_ingame.pot', context: 'actionbar/pour_in', source: 'Pour In', translation: 'Adicionar combustível'};
 assert.deepEqual(checkSemanticFeatures(pair).issues, []);
 assert.ok(checkSemanticFeatures({...pair, translation: 'Embarcar'}).issues.length);
 assert.deepEqual(checkSemanticFeatures({...pair, context: 'actionbar/pour_out', source: 'Pour Out', translation: 'Despejar combustível'}).issues, []);
 assert.deepEqual(checkSemanticFeatures({...pair, translation: 'Encher recipiente'}).issues, []);
 assert.deepEqual(checkSemanticFeatures({...pair, context: 'actionbar/pour_out', source: 'Pour Out', translation: 'Despejar gasolina'}).issues, []);
 assert.ok(checkSemanticFeatures({...pair, translation: 'Embarque'}).issues.length);
 assert.ok(checkSemanticFeatures({...pair, translation: ''}).issues.length);
 assert.deepEqual(checkSemanticFeatures({...pair, context: 'actionbar/board', source: 'Board', translation: 'Embarcar'}).features, []);
});
test('physical source duplicates count as one logical protected entry', () => {
 const source = entry('AT Rifleman', 'AT Rifleman');
 const result = checkCatalogSemanticFeatures(source + '\n' + source, entry('AT Rifleman', 'Atirador com Fuzil Antitanque'), file);
 assert.equal(result.logicalEntries, 1); assert.equal(result.protectedEntries, 1); assert.deepEqual(result.issues, []);
});
test('plural forms cannot be silently certified by a singular safeguard', () => {
 const target = 'msgctxt "test"\nmsgid "AT Rifleman"\nmsgid_plural "AT Riflemen"\nmsgstr[0] "Atirador com Fuzil Antitanque"\n';
 assert.throws(() => checkCatalogSemanticFeatures(target, target, file), /plural forms require explicit review/);
});
test('root check scans nested inventory and rejects absent catalogs or invalid UTF-8', () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-semantic-test-'));
 try {
  for (const locale of ['en', 'pt_BR']) fs.mkdirSync(path.join(root, 'localization', locale, 'interface/text/desc'), {recursive: true});
  assert.throws(() => checkSemanticRoot(root), /Empty source/);
  const source = path.join(root, 'localization/en', file), target = path.join(root, 'localization/pt_BR', file);
  fs.writeFileSync(source, entry('AT Rifleman', 'AT Rifleman'));
  assert.throws(() => checkSemanticRoot(root), /ENOENT/);
  fs.writeFileSync(target, entry('AT Rifleman', 'Atirador com Fuzil Antitanque'));
  const result = checkSemanticRoot(root);
  assert.equal(result.catalogs, 1); assert.equal(result.logicalEntries, 1); assert.equal(result.protectedEntries, 1);
  assert.deepEqual(result.issues, []);
  fs.writeFileSync(target, Buffer.from([0xff]));
  assert.throws(() => checkSemanticRoot(root), /encoded data/);
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-semantic-test-')));
  fs.rmSync(root, {recursive: true});
 }
});
