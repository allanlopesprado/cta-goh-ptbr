import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkTranslationStyle, checkStyleRoot} from './translation-style.mjs';
const entry = (source, target) => 'msgctxt "test"\nmsgid ' + JSON.stringify(source) + '\nmsgstr ' + JSON.stringify(target) + '\n';

test('PT translation diagnoses every em dash with its context and field', () => {
 const issues = checkTranslationStyle(entry('Hold the line!', 'Segure\u2014a linha\u2014agora!'), 'test.pot');
 assert.deepEqual(issues, [{file:'test.pot', context:'test', line:1, field:'msgstr', type:'em-dash-in-translation', count:2}]);
});
test('English source em dashes and standard PT punctuation are allowed', () => {
 assert.deepEqual(checkTranslationStyle(entry('Team A\u2014Attackers', 'Equipe A: Atacantes')), []);
 assert.deepEqual(checkTranslationStyle(entry('Hold!', 'Segure - agora; não recue.')), []);
});
test('historical-style metadata header is not a player-visible message', () => {
 assert.deepEqual(checkTranslationStyle('msgid ""\nmsgstr "Project-Id-Version: translation\u2014metadata\\n"\n'), []);
});
test('multiline translations are checked without rewriting inherited syntax', () => {
 const text = 'msgctxt "test"\nmsgid "Hold!"\nmsgstr ""\n"Segure a linha. "\n"Agora\u2014não recue!"\n';
 assert.equal(checkTranslationStyle(text)[0].count, 1);
});
test('all plural translation forms follow the PT punctuation policy', () => {
 const text = 'msgctxt "test"\nmsgid "Unit"\nmsgid_plural "Units"\nmsgstr[0] "Unidade"\nmsgstr[1] "Unidades\u2014agora"\n';
 assert.equal(checkTranslationStyle(text)[0].field, 'msgstr[1]');
});
test('root scan checks nested catalogs and rejects an empty inventory', () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-style-test-'));
 try {
  assert.throws(() => checkStyleRoot(root), /Empty translated/);
  fs.mkdirSync(path.join(root, 'nested'));
  fs.writeFileSync(path.join(root, 'nested/test.pot'), entry('Hold!', 'Segure\u2014agora!'));
  fs.writeFileSync(path.join(root, 'localization.info'), 'metadata');
  const result = checkStyleRoot(root);
  assert.equal(result.catalogs, 1);
  assert.equal(result.issues[0].file, 'nested/test.pot');
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-style-test-')));
  fs.rmSync(root, {recursive:true});
 }
});
