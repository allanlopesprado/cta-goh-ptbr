import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkSemanticFeatures, checkSemanticContracts, semanticVisibleText, semanticModelPattern, checkCatalogSemanticFeatures, checkSemanticRoot} from './semantic-features.mjs';
import {reviewedSemanticContracts} from './semantic-feature-policy.mjs';
import {checkTranslationStyle} from './translation-style.mjs';
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

test('reviewed US reinforcement and Dyle doctrine labels retain their nominal calibre', () => {
 const labels = [
  ['04-usa/reinf_usa.pot', '04-usa/menu_usa/107mm_m2', '4.2-inch Mortar M2', 'Morteiro M2 de 4.2 pol.'],
  ['041-usa_airborne/reinf_usa.pot', '041-usa_airborne/menu_usa/107mm_m2', '4.2-inch Mortar M2', 'Morteiro M2 de 4.2 pol.'],
  ['05-eng/1940_05_13_dyle.pot', '05-eng/1940_05_13_dyle/ui/reinf_doc_allround', '<c(B29557)>[All-Round]</c> BL 6-inch howitzer', '<c(B29557)>[Versátil]</c> Obuseiro BL de 6 pol.']
 ];
 for (const [filePart, contextPart, source, translation] of labels) {
  const pair = {file: 'interface/text/mission/single/' + filePart, context: 'mission/single/' + contextPart, source, translation};
  assert.deepEqual(checkSemanticFeatures(pair).issues, []);
  assert.ok(checkSemanticFeatures({...pair, translation: translation.replace(/(?:4\.2|6) pol\./, '107mm')}).issues.length);
 }
 const unrelated = {file: 'interface/text/mission/single/04-usa/reinf_usa.pot', context: 'mission/single/04-usa/narrator/distance', source: 'Not one inch!', translation: 'Nem um centímetro!'};
 assert.deepEqual(checkSemanticFeatures(unrelated).features, []);
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
  const result = checkSemanticRoot(root, {requireCompletePolicy: false});
  assert.equal(result.catalogs, 1); assert.equal(result.logicalEntries, 1); assert.equal(result.protectedEntries, 1);
  assert.deepEqual(result.issues, []);
  assert.ok(checkSemanticRoot(root).issues.some(issue => issue.type === 'semantic-contract-catalog-missing'));
  fs.writeFileSync(target, Buffer.from([0xff]));
  assert.throws(() => checkSemanticRoot(root), /encoded data/);
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-semantic-test-')));
  fs.rmSync(root, {recursive: true});
 }
});

const reviewedPair = (context, translation, sourceOverride) => {
 const contract = reviewedSemanticContracts.find(contract => contract.context === context);
 assert.ok(contract, 'Fixture must be bound to a reviewed corpus context: ' + context);
 return {file: contract.file, context, source: sourceOverride ?? contract.source, translation};
};

test('model identity catches MG 34 -> MG 42 even when unrelated style checks pass', () => {
 const pair = reviewedPair('desc/weapon/mg34_belt', 'MG 42 (Fita)');
 assert.deepEqual(checkTranslationStyle('msgctxt ' + JSON.stringify(pair.context) + '\nmsgid ' + JSON.stringify(pair.source) + '\nmsgstr ' + JSON.stringify(pair.translation) + '\n', pair.file), []);
 assert.ok(checkSemanticFeatures(pair).issues.some(issue => issue.type === 'equipment-model-identity'));
});
test('identity allows casing, space and hyphen variants without accepting another model', () => {
 for (const target of ['MG34 (Fita)', 'MG-34 (Fita)', 'mg 34 (fita)'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/weapon/mg34_belt', target)).issues, []);
 for (const target of ['MG 42 (Fita)', 'MG 134 (Fita)', 'MG 34A (Fita)'])
  assert.ok(checkSemanticFeatures(reviewedPair('desc/weapon/mg34_belt', target)).issues.some(issue => issue.type === 'equipment-model-identity'));
});
test('all audited model designations reject removal in isolated source-bound mutations', () => {
 let mutations = 0;
 for (const contract of reviewedSemanticContracts) {
  for (const requirement of contract.requirements.filter(requirement => requirement.kind === 'model')) {
   const isolated = {...contract, requirements: [requirement]};
   const pair = {...contract, translation: requirement.value};
   assert.deepEqual(checkSemanticContracts(pair, [isolated]).issues, [], contract.id + ': valid designation');
   assert.equal(checkSemanticContracts({...pair, translation: 'ZZ999999'}, [isolated]).issues[0]?.type, requirement.feature, contract.id + ': omitted/replaced designation');
   mutations++;
  }
 }
 assert.ok(mutations > 1000, 'Exercise the reviewed designation inventory, not only example models.');
});
test('different numeric components of a model cannot be joined into an equivalent code', () => {
 assert.ok(semanticModelPattern('BM-8-24').test('BM 8-24'));
 assert.ok(!semanticModelPattern('BM-8-24').test('BM-82-4'));
 assert.ok(!semanticModelPattern('M1').test('M12'));
});
test('valid No.2 -> Nº2 and accented proper names do not create false positives', () => {
 assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/entity/20mm_polsten', 'Polsten Nº2 (Reparo Universal)')).issues, []);
 assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/entity/210mm_morser18', '21cm Mörser 18')).issues, []);
 assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/entity/210mm_morser18', '21cm Morser 18')).issues, []);
});
test('short technical classifications preserve class and grade without imposing exact PT strings', () => {
 for (const target of ['Morteiro Médio', 'Morteiros Médios'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair('info/special/81mm_ml3', target)).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair('info/special/81mm_ml3', 'Obuseiro Médio')).issues.some(issue => issue.type === 'equipment-technical-class'));
 assert.ok(checkSemanticFeatures(reviewedPair('info/special/81mm_ml3', 'Morteiro Pesado')).issues.some(issue => issue.type === 'equipment-class-grade'));
 for (const target of ['Tanque Médio', 'Carro de Combate Médio', 'Carros de Combate Médios'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair('info/special/sherman1', target)).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair('info/special/sherman1', 'Tanque de Combustível Médio')).issues.some(issue => issue.type === 'equipment-technical-class'));
});
test('a different equipment class cannot be hidden behind the correct word', () => {
 assert.ok(checkSemanticFeatures(reviewedPair('info/special/81mm_ml3', 'Morteiro / Obuseiro Médio')).issues.some(issue => issue.type === 'equipment-technical-class'));
});
test('ordinary tank prose, fuel tanks and operation names have no lexical label contract', () => {
 for (const source of ['Fill the fuel tank.', 'Operation Panther begins.', 'Matilda is waiting by the bridge.', 'The tank supports infantry.'])
  assert.deepEqual(checkSemanticFeatures({file: 'interface/text/mission/single/example/mission.pot', context: 'speech/test', source, translation: 'Texto contextual livre.'}).features, []);
});
test('metric calibres allow 2cm / 20mm equivalence, comma, separators and plural formatting', () => {
 for (const target of ['2cm FlaK 38 L/112.5', '20mm FlaK 38 L/112.5', '2,0 cm FlaK 38 L/112.5', '20-mm FlaK 38 L/112.5'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/weapon/20mm_flak38', target)).issues, []);
 for (const target of ['3cm FlaK 38 L/112.5', '120mm FlaK 38 L/112.5', 'FlaK 38 L/112.5'])
  assert.ok(checkSemanticFeatures(reviewedPair('desc/weapon/20mm_flak38', target)).issues.some(issue => issue.type === 'explicit-metric-calibre'));
});
test('metric equivalence is exact and never uses binary rounding', () => {
 const pair = reviewedPair('desc/weapon/20mm_flak38', '20,0000000000000001mm FlaK 38 L/112.5');
 assert.ok(checkSemanticFeatures(pair).issues.some(issue => issue.type === 'explicit-metric-calibre'));
});
test('formatting attributes are not treated as model codes or calibre evidence', () => {
 const pair = reviewedPair('desc/weapon/20mm_flak38', '<f(anka)s(20)x.>FlaK 38 L/112.5');
 assert.ok(checkSemanticFeatures(pair).issues.some(issue => issue.type === 'explicit-metric-calibre'));
 assert.equal(semanticVisibleText('<c(B29557)>MG 34</c>'), 'mg 34');
});
test('nominal in aliases are protected only in audited US reinforcement labels', () => {
 for (const campaign of ['04-usa', '041-usa_airborne']) {
  const file = 'interface/text/mission/single/' + campaign + '/reinf_usa.pot';
  for (const [key, source, value] of [['114mm_m1', '4.5in M1 Howitzer', '4.5'], ['203mm_m1', '8in Howitzer M1', '8']]) {
   const type = key === '114mm_m1' ? 'Canhão' : 'Obuseiro';
   const pair = {file, context: 'mission/single/' + campaign + '/menu_usa/' + key, source, translation: type + ' M1 de ' + value + ' pol.'};
   assert.deepEqual(checkSemanticFeatures(pair).issues, []);
   assert.ok(checkSemanticFeatures({...pair, translation: 'Obuseiro M1 de ' + value + 'in'}).issues.some(issue => issue.type === 'untranslated-inch-unit'));
   assert.ok(checkSemanticFeatures({...pair, translation: 'Obuseiro M1 de 203mm'}).issues.some(issue => issue.type === 'nominal-inch-calibre'));
  }
 }
 const designation = {file: 'interface/text/desc/desc_vehicles_eng.pot', context: 'desc/entity/wolverine_mk1', source: '3-in SP Mk.I', translation: '3-in SP Mk.I'};
 assert.deepEqual(checkSemanticFeatures(designation).issues, []);
 assert.ok(!checkSemanticFeatures(designation).features.includes('nominal-inch-calibre'));
 for (const source of ['1912 in Great Britain', '1 in five', '88 in order'])
  assert.deepEqual(checkSemanticFeatures({file: 'interface/text/mission/single/example/mission.pot', context: 'speech/test', source, translation: 'Texto contextual.'}).features, []);
});
test('changed sources and moved contexts require review instead of silently losing protection', () => {
 const pair = reviewedPair('desc/weapon/mg34_belt', 'MG 34 (Fita)', 'MG 34 (Belt, revised)');
 assert.equal(checkSemanticFeatures(pair).issues[0].type, 'semantic-contract-source-drift');
 const contract = reviewedSemanticContracts.find(contract => contract.context === 'desc/weapon/mg34_belt');
 const catalog = 'msgctxt "unprotected/changed-context"\nmsgid "MG 34 (Belt)"\nmsgstr "MG 34 (Fita)"\n';
 assert.ok(checkCatalogSemanticFeatures(catalog, catalog, contract.file).issues.some(issue => issue.type === 'semantic-contract-context-missing' && issue.context === contract.context));
});
test('native bootcamp instruction protects the weapon and action but not an invented model or UI role', () => {
 const context = 'mission/single/00-bootcamp/01_inf-control/narrator/ger_officer/14';
 for (const target of ['Assuma o comando do soldado com fuzil antitanque.', 'Tome o controle do atirador com fuzil anticarro.', 'Controle o soldado com fuzil AT.'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair(context, target)).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Assuma o comando do operador de lançador antitanque.')).issues.some(issue => issue.type === 'mission-anti-tank-rifle-reference'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Ignore o soldado com fuzil antitanque.')).issues.some(issue => issue.type === 'mission-control-action'));
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, 'Assuma o comando do soldado com fuzil antitanque.')).issues, []);
});
test('native remaining counter accepts natural variants and rejects completed-counter polarity', () => {
 const context = 'mission/single/05-eng/1944_07_18_caen_goodwood/ui/obj_progress_offensive';
 for (const target of ['%1% Inimigos restantes a eliminar com Dano de Fogo', '%1% Inimigos a mais para eliminar com Dano de Fogo', 'Ainda faltam %1% inimigos. Dano por fogo.'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair(context, target)).issues, []);
 for (const target of ['%1% inimigos já eliminados com Dano de Fogo', '%1% Inimigos restantes, já eliminados com Dano de Fogo'])
  assert.ok(checkSemanticFeatures(reviewedPair(context, target)).issues.some(issue => issue.type === 'mission-remaining-counter'));
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, '%1% Inimigos restantes a eliminar com Dano de Fogo')).issues, []);
 assert.ok(!checkSemanticFeatures(reviewedPair(context, '%1% Inimigos restantes a eliminar com Dano de Fogo')).features.includes('mission-numeric-threshold'));
});

// This fixture exercises the contract mechanism. It is not evidence that a
// real mission with this text exists or has been inspected in the game.
const syntheticInstructionContract = {
 id: 'synthetic-capture-gate', file: 'test/synthetic.pot', context: 'objective/capture',
 source: 'Capture at least 5 intact tanks in the eastern sector. Do not destroy them.',
 evidence: 'Synthetic mutation fixture only.',
 requirements: [
  {feature: 'mission-capture-action', kind: 'text', anyOf: ['\\bcapture\\b', '\\bapreenda\\b'], noneOf: ['\\bnao\\s+(?:os\\s+)?capture\\b']},
  {feature: 'mission-target-polarity', kind: 'text', anyOf: ['\\bnao\\s+(?:os\\s+)?destrua\\b', '\\bsem\\s+destruir\\b']},
  {feature: 'mission-numeric-threshold', kind: 'text', anyOf: ['\\b(?:pelo\\s+menos|no\\s+minimo)\\s+(?:5|cinco)\\b']},
  {feature: 'mission-direction', kind: 'text', anyOf: ['\\b(?:leste|oriental)\\b'], noneOf: ['\\b(?:oeste|ocidental)\\b']}
 ]
};
const syntheticInstruction = translation => checkSemanticContracts({...syntheticInstructionContract, translation}, [syntheticInstructionContract]);
test('scoped instruction contracts permit synonymous action, lower-bound and direction expressions', () => {
 for (const target of ['Capture pelo menos 5 tanques intactos no leste. Não os destrua.', 'Apreenda no mínimo cinco tanques no setor oriental, sem destruir.'])
  assert.deepEqual(syntheticInstruction(target).issues, []);
});
test('scoped instruction mutations expose polarity, exact-vs-minimum, changed-number and east-vs-west errors', () => {
 const valid = 'Capture pelo menos 5 tanques intactos no leste. Não os destrua.';
 for (const [target, feature] of [
  [valid.replace('Capture', 'Destrua'), 'mission-capture-action'],
  [valid.replace('Não os destrua.', 'Destrua-os.'), 'mission-target-polarity'],
  [valid.replace('pelo menos 5', 'exatamente 5'), 'mission-numeric-threshold'],
  [valid.replace('pelo menos 5', 'pelo menos 6'), 'mission-numeric-threshold'],
  [valid.replace('leste', 'oeste'), 'mission-direction']
 ]) assert.ok(syntheticInstruction(target).issues.some(issue => issue.type === feature), feature);
});
test('a scoped mission contract cannot impose instructions on another context, source or file', () => {
 const pair = {...syntheticInstructionContract, translation: 'Texto livre.'};
 assert.deepEqual(checkSemanticContracts({...pair, context: 'different'}, [syntheticInstructionContract]).features, []);
 assert.deepEqual(checkSemanticContracts({...pair, file: 'different.pot'}, [syntheticInstructionContract]).features, []);
 assert.equal(checkSemanticContracts({...pair, source: pair.source.replace('5', '6')}, [syntheticInstructionContract]).issues[0].type, 'semantic-contract-source-drift');
});

test('attached gun/mount variants and revision stars are part of the reviewed model identity', () => {
 assert.deepEqual(checkSemanticFeatures(reviewedPair('desc/entity/m4a3_105', 'M4A3(105)')).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair('desc/entity/m4a3_105', 'M4A3(76)')).issues.some(issue => issue.type === 'equipment-model-identity'));
 const star = reviewedSemanticContracts.find(contract => contract.requirements.some(requirement => requirement.kind === 'model' && requirement.value === 'Mk.I*'));
 assert.ok(star);
 const requirement = star.requirements.find(requirement => requirement.kind === 'model' && requirement.value === 'Mk.I*');
 assert.deepEqual(checkSemanticContracts({...star, translation: 'Mk.I*'}, [{...star, requirements: [requirement]}]).issues, []);
 assert.ok(checkSemanticContracts({...star, translation: 'Mk.I'}, [{...star, requirements: [requirement]}]).issues.length);
 assert.ok(semanticModelPattern('MG 37(t)').test('MG37(t)'));
 assert.ok(!semanticModelPattern('MG 37(t)').test('MG37(f)'));
});
test('barrel designations distinguish L/43 from L/48 without parsing unrelated format numbers', () => {
 const pair = reviewedPair('desc/weapon/75mm_kwk40', '7.5cm KwK 40 L/43');
 assert.deepEqual(checkSemanticFeatures(pair).issues, []);
 assert.deepEqual(checkSemanticFeatures({...pair, translation: '7,5 cm KwK 40 L / 43,0'}).issues, []);
 assert.ok(checkSemanticFeatures({...pair, translation: '7.5cm KwK 40 L/48'}).issues.some(issue => issue.type === 'equipment-barrel-designation'));
 assert.ok(checkSemanticFeatures({...pair, translation: '<f(anka)s(43)x.>7.5cm KwK 40'}).issues.some(issue => issue.type === 'equipment-barrel-designation'));
});
test('nominal pounder and bomb-weight designations retain number and accept PT unit aliases', () => {
 const gun = reviewedSemanticContracts.find(contract => contract.requirements.some(requirement => requirement.kind === 'nominal-pound' && requirement.unit === 'pounder' && requirement.value === '6'));
 assert.ok(gun);
 const requirement = gun.requirements.find(requirement => requirement.kind === 'nominal-pound' && requirement.value === '6');
 for (const translation of ['6-pdr', '6 libras', '6 pounder'])
  assert.deepEqual(checkSemanticContracts({...gun, translation}, [{...gun, requirements: [requirement]}]).issues, []);
 for (const translation of ['17-pdr', '6 pol.', '6lb'])
  assert.ok(checkSemanticContracts({...gun, translation}, [{...gun, requirements: [requirement]}]).issues.length);
 const bomb = reviewedSemanticContracts.find(contract => contract.requirements.some(requirement => requirement.kind === 'nominal-pound' && requirement.unit === 'lb' && requirement.value === '250'));
 assert.ok(bomb);
 const weight = bomb.requirements.find(requirement => requirement.kind === 'nominal-pound' && requirement.unit === 'lb');
 assert.deepEqual(checkSemanticContracts({...bomb, translation: 'Bomba de 250 libras'}, [{...bomb, requirements: [weight]}]).issues, []);
 assert.ok(checkSemanticContracts({...bomb, translation: 'Bomba de 500lb'}, [{...bomb, requirements: [weight]}]).issues.length);
 assert.ok(checkSemanticContracts({...bomb, translation: 'Bomba de 113,4kg'}, [{...bomb, requirements: [weight]}]).issues.length);
});
test('reviewed source-side class exception permits only audited Gun class in its bound context', () => {
 const context = 'mission/single/04-usa/menu_usa/114mm_m1';
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, 'Canhão M1 de 4.5 pol.')).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Obuseiro M1 de 4.5 pol.')).issues.some(issue => issue.type === 'reviewed-source-UI-class-alignment'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Canhão M2 de 4.5 pol.')).issues.some(issue => issue.type === 'equipment-model-identity'));
 const sameSourceElsewhere = {file: 'test/not-reviewed.pot', context, source: '4.5in M1 Howitzer', translation: 'Obuseiro M1 de 4.5 pol.'};
 assert.deepEqual(checkSemanticFeatures(sameSourceElsewhere).features, []);
});
test('real minimum-survivor contract distinguishes minimum 5, exact 5, minimum 6 and inverted survival', () => {
 const context = 'mission/single/06-bonus/1945_04_yugoslavia/task4';
 for (const target of ['Pelo menos 5 caminhões devem sobreviver.', 'Devem sobreviver no mínimo cinco caminhões.', '5 caminhões ou mais devem sobreviver.'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair(context, target)).issues, []);
 for (const target of ['Exatamente 5 caminhões devem sobreviver.', 'Pelo menos 6 caminhões devem sobreviver.', 'No máximo 5 caminhões devem sobreviver.'])
  assert.ok(checkSemanticFeatures(reviewedPair(context, target)).issues.some(issue => issue.type === 'mission-minimum-survivors'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Pelo menos 5 caminhões devem ser destruídos.')).issues.some(issue => issue.type === 'mission-survival-action'));
});
test('real two-of-three contracts protect lower bound, total zones and holding rather than capture', () => {
 for (const task of ['task03', 'task04', 'task05', 'task06']) {
  const context = 'mission/single/051-ger_finesthour/1944_10_woensdrecht/tasks/' + task;
  for (const target of ['Manter o terreno! (manter pelo menos 2 de 3 zonas)', 'Defenda o terreno! (manter no mínimo duas das três zonas)'])
   assert.deepEqual(checkSemanticFeatures(reviewedPair(context, target)).issues, []);
  for (const target of ['Manter exatamente 2 de 3 zonas!', 'Manter pelo menos 3 de 3 zonas!', 'Manter pelo menos 2 de 4 zonas!'])
   assert.ok(checkSemanticFeatures(reviewedPair(context, target)).issues.some(issue => issue.type === 'mission-zone-minimum'));
  assert.ok(checkSemanticFeatures(reviewedPair(context, 'Capturar o terreno! (manter pelo menos 2 de 3 zonas)')).issues.some(issue => issue.type === 'mission-zone-hold-action'));
 }
});
test('real alarm prohibition is not satisfied by unrelated negation in the same sentence', () => {
 const context = 'mission/single/02-ger/1942_09_elbrus/tasks/opt_task_01';
 for (const target of ['Não deixe que o inimigo dê o alarme!', 'Não dispare o alarme!', 'Evite provocar o alarme!', 'Sem dar o alarme!'])
  assert.deepEqual(checkSemanticFeatures(reviewedPair(context, target)).issues, []);
 for (const target of ['Dispare o alarme!', 'Não se preocupe; dispare o alarme!', 'Não se preocupe, dispare o alarme!', 'Não deixe que o inimigo não dê o alarme!'])
  assert.ok(checkSemanticFeatures(reviewedPair(context, target)).issues.some(issue => issue.type === 'mission-alarm-prohibition'));
});
test('native action and damage safeguards reject explicit reversed instructions', () => {
 assert.ok(checkSemanticFeatures(reviewedPair('mission/single/00-bootcamp/01_inf-control/narrator/ger_officer/14', 'Não assuma o comando do soldado com fuzil antitanque.')).issues.some(issue => issue.type === 'mission-control-action'));
 assert.ok(checkSemanticFeatures(reviewedPair('mission/single/05-eng/1944_07_18_caen_goodwood/ui/obj_progress_offensive', '%1% Inimigos restantes a eliminar sem Dano de Fogo')).issues.some(issue => issue.type === 'mission-fire-damage-reference'));
});

test('reviewed Churchill calibre exception cannot become a global conversion or allow wrong model', () => {
 const context = 'mission/single/0x-skirmish/menu_eng/churchill_mk4_qf75';
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, 'Churchill Mk.IV (QF 75mm)')).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Churchill Mk.IV (QF 75-pdr)')).issues.some(issue => issue.type === 'reviewed-source-UI-calibre-alignment'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, 'Churchill Mk.III (QF 75mm)')).issues.some(issue => issue.type === 'equipment-model-identity'));
 const unrelated = {file: 'interface/text/mission/single/unreviewed/dialogue.pot', context: 'speech/test', source: 'Churchill Mk.IV (QF 75-pdr)', translation: 'Churchill Mk.IV (QF 75-pdr)'};
 assert.deepEqual(checkSemanticFeatures(unrelated).features, []);
 assert.equal(checkSemanticFeatures(reviewedPair(context, 'Churchill Mk.IV (QF 75mm)', 'Churchill Mk.IV (QF 75mm)')).issues[0].type, 'semantic-contract-source-drift');
});
test('native report hint retains after-report lockout and near-hotel visibility conditions', () => {
 const context = 'mission/single/05-eng/1944_09_20_oosterbeek/ui/hint_side_quest';
 const valid = 'As atividades opcionais não estarão disponíveis após você se apresentar ao QG. O botão aparece quando você está perto do hotel.';
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, valid)).issues, []);
 assert.deepEqual(checkSemanticFeatures(reviewedPair(context, valid.replace('perto', 'próximo'))).issues, []);
 assert.ok(checkSemanticFeatures(reviewedPair(context, valid.replace('após', 'antes de'))).issues.some(issue => issue.type === 'mission-after-report-unavailability'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, valid.replace('não estarão', 'estarão'))).issues.some(issue => issue.type === 'mission-after-report-unavailability'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, valid.replace('perto', 'longe'))).issues.some(issue => issue.type === 'mission-near-hotel-condition'));
 assert.ok(checkSemanticFeatures(reviewedPair(context, valid.replace('você está perto', 'você não está perto'))).issues.some(issue => issue.type === 'mission-near-hotel-condition'));
});

test('reviewed radio Out endings allow closure synonyms but reject a reply handoff', () => {
 for (const part of ['part01_04', 'part01_13', 'part01_19']) {
  const context = 'mission/single/05-eng/1940_05_13_dyle/narrator/' + part;
  for (const ending of ['Encerro.', 'Terminado.', 'Desligo.', 'Fim da transmissão.'])
   assert.deepEqual(checkSemanticFeatures(reviewedPair(context, 'Mensagem. ' + ending)).issues, []);
  for (const ending of ['Câmbio.', 'Câmbio e encerro.', 'Câmbio final.'])
   assert.ok(checkSemanticFeatures(reviewedPair(context, 'Mensagem. ' + ending)).issues.some(issue => issue.type === 'radio-out-terminator'));
 }
});
test('reviewed radio Over endings invite a reply and cannot become Out', () => {
 for (const part of ['part01_11', 'part01_12', 'part01_18']) {
  const context = 'mission/single/05-eng/1940_05_13_dyle/narrator/' + part;
  for (const ending of ['Câmbio.', 'Aguardo sua resposta.'])
   assert.deepEqual(checkSemanticFeatures(reviewedPair(context, 'Mensagem. ' + ending)).issues, []);
  for (const ending of ['Encerro.', 'Terminado.', 'Desligo.', 'Câmbio e encerro.'])
   assert.ok(checkSemanticFeatures(reviewedPair(context, 'Mensagem. ' + ending)).issues.some(issue => issue.type === 'radio-over-terminator'));
 }
});
test('radio contracts do not rewrite movement, warnings, finished wars or intentional unreviewed wording', () => {
 const file = 'interface/text/mission/single/05-eng/1940_05_13_dyle.pot';
 for (const [source, translation] of [['Watch out!', 'Cuidado!'], ['Zoom out', 'Afastar'], ['The war is over.', 'A guerra acabou.'], ['Take them out!', 'Eliminem-nos!'], ['Over and out.', 'Câmbio e encerro.']])
  assert.deepEqual(checkSemanticFeatures({file, context: 'mission/single/05-eng/1940_05_13_dyle/narrator/unreviewed', source, translation}).features, []);
});
