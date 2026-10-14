import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkLabelConsistency, checkCatalogLabelConsistency, checkLabelRoot} from './label-consistency.mjs';

const file = 'interface/text/desc/desc_weapon_ger.pot', context = 'desc/weapon/test';
const check = (source, translation, options = {}) => checkLabelConsistency({file, context, source, translation, ...options});
const entry = (source, translation, ctx = context) => 'msgctxt ' + JSON.stringify(ctx) + '\nmsgid ' + JSON.stringify(source) + '\nmsgstr ' + JSON.stringify(translation) + '\n';

test('attached in unit aliases follow the short nominal-label convention', () => {
 for (const [source, translation] of [['4.5in M1 Howitzer', 'Obuseiro M1 de 4.5 pol.'], ['8in Howitzer M1', 'Obuseiro M1 de 8 pol.']]) {
  assert.deepEqual(check(source, translation).issues, []);
  assert.ok(check(source, translation.replace('pol.', 'polegadas')).issues.some(i => i.type === 'label-inch-unit'));
 }
});

test('nominal alias selection does not translate integral designations or prepositions', () => {
 assert.deepEqual(check('3-in SP Mk.I', '3-in SP Mk.I').families, []);
 assert.deepEqual(check('1912 in Great Britain', '1912 na Grã-Bretanha', {context: 'info/weapon/test'}).families, []);
 assert.deepEqual(check('Only 1 in five survived', 'Somente 1 em cada 5 sobreviveu', {context: 'info/weapon/test'}).families, []);
});

test('Dyle nominal doctrine label is protected without selecting its dialogue', () => {
 const options = {file: 'interface/text/mission/single/05-eng/1940_05_13_dyle.pot', context: 'mission/single/05-eng/1940_05_13_dyle/doctrine_allround'};
 assert.deepEqual(check('All-Round: BL 6-inch Howitzer', 'Versátil: Obuseiro BL de 6 pol.', options).issues, []);
 assert.ok(check('All-Round: BL 6-inch Howitzer', 'Versátil: Obuseiro BL de 6 polegadas', options).issues.some(i => i.type === 'label-inch-unit'));
 assert.deepEqual(check('All-Round: BL 6-inch Howitzer', 'Obuseiro de seis polegadas.', {...options, context: options.context.replace('doctrine_allround', 'narrator/doc_allround_01')}).families, []);
});
function temporary(run) {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-label-test-'));
 try {return run(root);} finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-label-test-')));
  fs.rmSync(root, {recursive: true});
 }
}
function localeFixture(root, source = entry('StG 44 (Scoped)', ''), target = entry('StG 44 (Scoped)', 'StG 44 (Mira Telescópica)')) {
 for (const locale of ['en', 'pt_BR']) fs.mkdirSync(path.join(root, 'localization', locale, path.dirname(file)), {recursive: true});
 fs.writeFileSync(path.join(root, 'localization/en', file), source);
 fs.writeFileSync(path.join(root, 'localization/pt_BR', file), target);
}

test('Scope and Scoped share the agreed parenthetical form', () => {
 for (const source of ['StG 44 (Scoped)', 'Mosin M27 (Scope)', 'StG 44 (scope)'])
  assert.deepEqual(check(source, 'Arma (Mira Telescópica)').issues, []);
});
test('scope conventions catch wording, capitalization and missing qualifier', () => {
 for (const translation of ['StG 44 (Com Mira Telescópica)', 'StG 44 (mira telescópica)', 'StG 44 (Luneta)', 'StG 44'])
  assert.equal(check('StG 44 (Scoped)', translation).issues[0].type, 'label-qualifier');
});
test('prose can use com mira or luneta without a label-style rewrite', () => {
 const source = 'Aim using the scope (Scope)', translation = 'Mire com a luneta.';
 assert.deepEqual(check(source, translation, {context: 'info/weapon/test'}).families, []);
 assert.deepEqual(check(source, translation, {file: 'interface/text/mission/single/test/test.pot', context: 'mission/single/test/test/dialogue/help'}).families, []);
 assert.deepEqual(check('Scope', 'Mira telescópica', {file: 'interface/text/dlg_ingame.pot', context: 'actionbar/scope'}).families, []);
});
test('parenthetical aliases are anchored, not substring matches', () => {
 assert.deepEqual(check("Observer (Observer's Scope)", 'Observador (Luneta)').families, []);
 assert.deepEqual(check('StG 44 (Scoped prototype)', 'StG 44').families, []);
});
test('doctrine counts, colors and nested model tokens are not qualifiers', () => {
 const source = '<c(B29557)>( II )</c> 38(t) SmK(H) T/NG(H) (Scope)';
 assert.deepEqual(check(source, '<c(B29557)>( II )</c> 38(t) SmK(H) T/NG(H) (Mira Telescópica)').issues, []);
 assert.deepEqual(check('<c(B29557)>38(t) SmK(H)</c>', '38(t) SmK(H)').families, []);
 assert.deepEqual(check('Weapon (prototype (Scope))', 'Arma').families, []);
});
test('known qualifiers have outside spacing and no padding inside parentheses', () => {
 for (const target of ['StG 44(Mira Telescópica)', 'StG 44 ( Mira Telescópica )', 'StG 44<c(B29557)>(Mira Telescópica)</c>',
  'StG 44  (Mira Telescópica)', 'StG 44\n(Mira Telescópica)', 'StG 44\n (Mira Telescópica)', 'StG 44\t(Mira Telescópica)'])
  assert.equal(check('StG 44 (Scoped)', target).issues[0].type, 'label-qualifier-format');
 assert.deepEqual(check('(Scope)', '(Mira Telescópica)').issues, []);
 assert.deepEqual(check('38(t) (Scope)', '38(t) (Mira Telescópica)').issues, []);
});
test('variant labels allow agreed masculine and feminine forms without a gender certificate', () => {
 const source = 'Unit (early) (Mid) (late) (tow) (Mounted) (Dismounted)';
 assert.deepEqual(check(source, 'Unidade (Inicial) (Intermediária) (Tardia) (Rebocada) (Embarcada) (Apeada)').issues, []);
 assert.deepEqual(check(source, 'Grupo (Inicial) (Intermediário) (Tardio) (Rebocado) (Embarcado) (Apeado)').issues, []);
});
test('flame, carriage, supply, belt and drums have distinct canonical forms', () => {
 const source = 'Item (Flame) (M8 Carriage) (Supplies) (Belt) (Drum) (Doubledrum)';
 assert.deepEqual(check(source, 'Item (Lança-chamas) (Reparo M8) (Suprimentos) (Fita) (Tambor) (Tambor Duplo)').issues, []);
 assert.deepEqual(check('Item (M8Carriage) (Supply) (Double drum)', 'Item (Reparo M8) (Suprimentos) (Tambor Duplo)').issues, []);
});
test('named engineering vehicles are selected, human engineers are not', () => {
 for (const vehicle of ['Bedford OYD', 'GMC CCKW', 'Ford', 'Opel Blitz', 'ZIS-5', 'GAZ-AAA', 'Sd.Kfz 2']) {
  assert.deepEqual(check(vehicle + ' (Engineer)', vehicle + ' (Engenharia)').issues, []);
  assert.equal(check(vehicle + ' (Engineer)', vehicle + ' (Engenheiro)').issues[0].family, 'vehicle-engineer');
 }
 assert.deepEqual(check('Soldier (Engineer)', 'Soldado (Engenheiro)', {context: 'desc/human/test'}).families, []);
 assert.deepEqual(check('Ford (Engineer)', 'Ford (Engenheiro)', {context: 'desc/human/test'}).families, []);
 assert.deepEqual(check('Ford', 'Ford (Engenharia)').families, []);
});
test('double is an ammunition qualifier; stick grenade and unrelated double remain untouched', () => {
 const source = '7.92mm SmK(H) Drum (double)';
 assert.deepEqual(check(source, 'Tambor SmK(H) 7.92mm (Duplo)', {file: 'interface/text/desc/desc_ammo_ger.pot'}).issues, []);
 assert.deepEqual(check(source, 'Outro texto').families, []);
 assert.deepEqual(check('M/32 (Stick) Grenade', 'Granada de Cabo M/32', {file: 'interface/text/desc/desc_gear_fin.pot'}).families, []);
});
test('each repeated qualifier consumes a separate target occurrence', () => {
 const source = 'MG (Drum) / MG (Drum)';
 assert.equal(check(source, 'MG (Tambor)').issues.length, 1);
 assert.deepEqual(check(source, 'MG (Tambor) / MG (Tambor)').issues, []);
});
test('mission menu and reinforcement labels are covered, hints and dialogue excluded', () => {
 const options = {file: 'interface/text/mission/single/test/reinf.pot'};
 for (const ctx of ['mission/single/test/menu_ger/tank', 'mission/single/test/reinf/tank', 'mission/single/test/reinforcement/tank', 'mission/single/test/reinforcements/tank', 'mission/single/test/reinf_tank'])
  assert.equal(check('KV-1 (Late)', 'KV-1', {...options, context: ctx}).issues.length, 1);
 for (const ctx of ['mission/single/test/menu_ger/hint', 'mission/single/test/dialog/tank', 'mission/single/test/info/tank'])
  assert.deepEqual(check('KV-1 (Late)', 'KV-1', {...options, context: ctx}).families, []);
});
test('multiline and long source descriptions are outside short-label conventions', () => {
 assert.deepEqual(check('Weapon (Scope)\nA description.', 'Uma arma').families, []);
 assert.deepEqual(check('Weapon (Scope) ' + 'description '.repeat(25), 'Uma arma').families, []);
});
test('unit role parts distinguish operators, assistants and crews', () => {
 const options = {context: 'desc/human/test'};
 for (const [source, target, family] of [
  ['MG Operator', 'Operador de MG', 'mg-operator'], ['MG Asst.', 'Auxiliar de MG', 'mg-assistant'],
  ['MG Asst', 'Auxiliar de MG', 'mg-assistant'], ['MG Crew Asst.', 'Auxiliar da Guarnição de MG', 'mg-crew-assistant'],
  ['MG Crew', 'Guarnição de MG', 'mg-crew'], ['Flak Crew Squadleader', 'Líder de Esquadra da Guarnição Flak', 'flak-crew'],
  ['Weapon Crew', 'Guarnição de Arma', 'weapon-crew']
 ]) {
  assert.deepEqual(check(source, target, options).issues, []);
  assert.deepEqual(check(source, 'Outra função', options).families, [family]);
 }
 assert.equal(check('MG Crew Asst.', 'Guarnição de MG', options).issues[0].family, 'mg-crew-assistant');
});
test('crew policy does not expand to tanks, vehicles, LMG, SMG or MG34', () => {
 for (const source of ['Crew', 'Tank Crew', 'Vehicle Crew', 'LMG Operator', 'SMG Operator', 'MG34 Operator', 'MG Operatorium'])
  assert.deepEqual(check(source, source, {context: 'desc/human/test'}).families, []);
 assert.deepEqual(check('MG Operator', 'Operador de metralhadora', {context: 'info/human/test'}).families, []);
});
test('single-soldier labels enforce editorial role parts and their qualifier independently', () => {
 const options = {context: 'desc/squad/single_mg'};
 assert.deepEqual(check('MG Operator (Early)', 'Operador de MG (Inicial)', options).issues, []);
 assert.equal(check('MG Operator (Early)', 'Operador de metralhadora (Inicial)', options).issues[0].family, 'mg-operator');
 assert.deepEqual(check('MG Operator', 'Operador de metralhadora', {context: 'desc/squad/whole_squad'}).families, []);
});
test('explicit motor modifiers can occupy reviewed positions inside MG roles', () => {
 const options = {context: 'desc/human/test'};
 for (const [source, target] of [
  ['Motor MG Operator [CA]', 'Operador Motorizado de MG [CA]'],
  ['1st AD. Motor MG Asst. [PSZ]', 'Auxiliar Motorizado de MG da 1ª AD [PSZ]'],
  ['Motor Scout MG Operator [BA]', 'Operador Motorizado de MG de Reconhecimento [BA]'],
  ['Motor MG Operator [BA]', 'Operador de MG Motorizado [BA]']
 ]) assert.deepEqual(check(source, target, options).issues, []);
 assert.equal(check('MG Operator', 'Operador Motorizado de MG', options).issues.length, 1);
 assert.equal(check('MG Asst.', 'Auxiliar Motorizado de MG', options).issues.length, 1);
 assert.equal(check('Motor Rifleman / MG Operator', 'Atirador Motorizado / Operador Motorizado de MG', options).issues.length, 1);
});
test('Rifleman convention is limited to single soldiers, not section or squad labels', () => {
 assert.deepEqual(check('AT Rifleman', 'Atirador com Fuzil Antitanque', {context: 'desc/human/test'}).issues, []);
 assert.equal(check('Rifleman', 'Fuzileiro', {context: 'desc/squad/single_rifleman'}).issues[0].family, 'rifleman');
 assert.deepEqual(check('Rifleman Squad', 'Esquadra de Fuzileiros', {context: 'desc/human/test'}).families, []);
 assert.deepEqual(check('Rifleman Section', 'Seção de Fuzileiros', {context: 'desc/human/test'}).families, []);
});
test('collective heads and compound sapper roles are not generic Rifleman labels', () => {
 const options = {context: 'desc/squad/single_mg'};
 assert.deepEqual(check('Automatic Rifleman Team', 'Equipe de Atiradores de Fuzil Automático', options).families, []);
 assert.deepEqual(check('Rifleman Unit', 'Unidade de Atiradores', options).families, []);
 assert.deepEqual(check('Assault Sapper AT Rifleman [KA]', 'Sapador de Assalto com Fuzil Antitanque [KA]', {context: 'desc/human/test'}).families, []);
});
test('inch notation uses pol. only in short source-selected labels', () => {
 for (const source of ['BL 6-inch Gun', 'BL 6-Inch Gun', 'QF 4.5inch Howitzer']) {
  assert.deepEqual(check(source, 'Canhão de 6 pol.').issues, []); // Number checking is deliberately separate.
  assert.equal(check(source, 'Canhão de 6 polegadas').issues[0].type, 'label-inch-unit');
 }
 assert.deepEqual(check('BL 6-inch Gun', 'Canhão de 6 polegadas', {context: 'info/entity/gun'}).families, []);
 assert.deepEqual(check('Not one inch!', 'Nem uma polegada!', {file: 'interface/text/mission/single/test/test.pot', context: 'mission/single/test/test/dialog/help'}).families, []);
 assert.deepEqual(check('Ford 3-Ton / 75mm Gun Mk.I', 'Ford 3-Ton / Canhão de 75mm Mk.I').families, []);
});
test('inch label abbreviation protects multiplicity without replacing numeric checks', () => {
 assert.equal(check('3-inch / 3-inch Mortars', 'Morteiros de 3 pol.').issues.length, 1);
 assert.deepEqual(check('3-inch / 4.2-inch Mortars', 'Morteiros de 3 pol. e 4,2 pol.').issues, []);
 assert.equal(check('3-inch Mortar', 'Morteiro de 3 pol. (polegadas)').issues.length, 1);
 assert.equal(check('3-inch Mortar', 'Morteiro de 3 Pol.').issues.length, 1);
});
test('Royal Engineers Field Section convention is not applied to generic engineers', () => {
 const options = {context: 'desc/squad/engineers'};
 assert.deepEqual(check('Royal Engineers Field Section', 'Seção de Campo dos Engenheiros Reais', options).issues, []);
 assert.equal(check('Royal Engineers Field Section', 'Seção de Engenheiros Reais', options).issues.length, 1);
 assert.deepEqual(check('Engineers Field Section', 'Seção de Engenharia', options).families, []);
 assert.deepEqual(check('Royal Engineers Field Section', 'Texto corrido', {context: 'info/squad/engineers'}).families, []);
});
test('role occurrence consumption and exact editorial capitalization', () => {
 const options = {context: 'desc/human/test'};
 assert.equal(check('MG Operator / MG Operator', 'Operador de MG', options).issues.length, 1);
 assert.equal(check('MG Operator', 'operador de MG', options).issues.length, 1);
 assert.equal(check('Rifleman', 'Atiradores', options).issues.length, 1);
});
test('catalog matching never substitutes a different source or context', () => {
 const en = entry('StG 44 (Scoped)', '');
 for (const pt of ['', entry('StG 44', 'StG 44 (Mira Telescópica)'), entry('StG 44 (Scoped)', 'StG 44 (Mira Telescópica)', 'desc/weapon/other')])
  assert.equal(checkCatalogLabelConsistency(en, pt, file).issues[0].type, 'label-association');
});
test('duplicate targets fail closed while identical source entries count once', () => {
 const en = entry('StG 44 (Scoped)', ''), pt = entry('StG 44 (Scoped)', 'StG 44 (Mira Telescópica)');
 const result = checkCatalogLabelConsistency(en + '\n' + en, pt, file);
 assert.equal(result.logicalEntries, 1); assert.equal(result.protectedEntries, 1); assert.equal(result.counts.scope, 1);
 assert.deepEqual(result.issues, []);
 assert.equal(checkCatalogLabelConsistency(en, pt + '\n' + pt, file).issues[0].type, 'label-association');
});
test('ambiguous legacy effective sources and competing source signatures cannot be certified', () => {
 const legacy = 'msgctxt ' + JSON.stringify(context) + '\nmsgid ""\nmsgstr "StG 44 (Scoped)"\n';
 const regular = entry('StG 44 (Scoped)', '');
 assert.equal(checkCatalogLabelConsistency(legacy + '\n' + regular, entry('StG 44 (Scoped)', 'StG 44 (Mira Telescópica)'), file).issues[0].type, 'label-association');
 const otherLegacy = 'msgctxt ' + JSON.stringify(context) + '\nmsgid ""\nmsgstr "Weapon (Drum)"\n';
 const pt = 'msgctxt ' + JSON.stringify(context) + '\nmsgid ""\nmsgstr "StG 44 (Mira Telescópica)"\n';
 assert.equal(checkCatalogLabelConsistency(legacy + '\n' + otherLegacy, pt, file).issues[0].type, 'label-association');
});
test('protected plural forms require explicit review', () => {
 const plural = 'msgctxt ' + JSON.stringify(context) + '\nmsgid "Weapon (Scope)"\nmsgid_plural "Weapons (Scope)"\nmsgstr[0] "Arma (Mira Telescópica)"\n';
 assert.throws(() => checkCatalogLabelConsistency(plural, plural, file), /plural forms require explicit review/);
});
test('root checks nested catalogs and validates UTF-8 in both locales', () => temporary(root => {
 localeFixture(root);
 const result = checkLabelRoot(root);
 assert.equal(result.catalogs, 1); assert.equal(result.logicalEntries, 1); assert.equal(result.protectedEntries, 1);
 assert.deepEqual(result.issues, []);
 for (const locale of ['en', 'pt_BR']) {
  localeFixture(root);
  fs.writeFileSync(path.join(root, 'localization', locale, file), Buffer.from([0xff]));
  assert.throws(() => checkLabelRoot(root), /encoded data/);
 }
}));
test('root fails closed on empty inventory and a missing paired catalog', () => temporary(root => {
 localeFixture(root);
 fs.unlinkSync(path.join(root, 'localization/pt_BR', file));
 assert.throws(() => checkLabelRoot(root), /ENOENT/);
 fs.unlinkSync(path.join(root, 'localization/en', file));
 assert.throws(() => checkLabelRoot(root), /Empty source/);
}));
test('source locale ancestor links are rejected even when catalogs are valid', () => temporary(root => {
 const outside = path.join(root, 'outside');
 localeFixture(outside);
 fs.mkdirSync(path.join(root, 'localization'), {recursive: true});
 fs.symlinkSync(path.join(outside, 'localization/en'), path.join(root, 'localization/en'), process.platform === 'win32' ? 'junction' : 'dir');
 fs.symlinkSync(path.join(outside, 'localization/pt_BR'), path.join(root, 'localization/pt_BR'), process.platform === 'win32' ? 'junction' : 'dir');
 assert.throws(() => checkLabelRoot(root), /ancestor symlink/);
}));
test('target nested folder links cannot redirect paired catalog reads', () => temporary(root => {
 localeFixture(root);
 const original = path.join(root, 'localization/pt_BR/interface/text/desc'), moved = path.join(root, 'outside-desc');
 fs.renameSync(original, moved);
 fs.symlinkSync(moved, original, process.platform === 'win32' ? 'junction' : 'dir');
 assert.throws(() => checkLabelRoot(root), /Catalog symlink/);
}));
test('unsafe catalog paths are rejected by the root scanner', () => temporary(root => {
 localeFixture(root);
 fs.writeFileSync(path.join(root, 'localization/en/outside.pot'), entry('Weapon (Scope)', ''));
 assert.throws(() => checkLabelRoot(root), /Unsafe catalog path/);
}));
