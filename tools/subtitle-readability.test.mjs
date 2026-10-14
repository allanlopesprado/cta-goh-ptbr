import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {visibleTemplate, isSubtitleCandidate, analyzeReadability, checkReadabilityRoot} from './subtitle-readability.mjs';

test('visible text removes known formatting while keeping variables and literal angles', () => {
 assert.equal(visibleTemplate('<c(fff)>Olá</c><x(-3)><f(pobeda)> %1% < 5'), 'Olá %1% < 5');
});
test('readability counts Unicode NFC characters, not UTF8 bytes or formatting', () => {
 const r = analyzeReadability('Hi', '<c(fff)>Olá</c>');
 assert.equal(r.translationCharacters, 3); assert.equal(r.expansionRatio, 1.5);
 assert.equal(analyzeReadability('a', 'a\u0301').translationCharacters, 1);
});
test('length and expansion are advisory and never certify actual display time', () => {
 const r = analyzeReadability('A'.repeat(100), 'B'.repeat(320));
 assert.ok(r.advisory.includes('long-dialogue-template')); assert.ok(r.advisory.includes('high-source-to-target-expansion'));
 assert.deepEqual(r.issues, []); assert.equal(r.confirmedDisplaySeconds, null);
 assert.equal(r.screenFitVerified, false); assert.equal(r.audioSyncVerified, false);
});
test('only confirmed positive display time can produce measured template reading rate', () => {
 const r = analyzeReadability('text', 'A'.repeat(85), {confirmedDisplaySeconds: 2});
 assert.equal(r.templateCharactersPerConfirmedSecond, 42.5);
 assert.ok(r.advisory.includes('reading-rate-above-reference'));
 assert.throws(() => analyzeReadability('text', 'text', {confirmedDisplaySeconds: -1}));
 assert.throws(() => analyzeReadability('text', 'text', {referenceCharactersPerSecond: 0}));
});
test('variable templates cannot claim an actual rendered reading rate', () => {
 const r = analyzeReadability('%1%', 'Restantes: %1%', {confirmedDisplaySeconds: 2});
 assert.equal(r.templateCharactersPerConfirmedSecond, null);
 assert.ok(r.advisory.includes('rendered-variable-length-unknown'));
});
test('line and paragraph flags do not force cinema layout into a game', () => {
 const r = analyzeReadability('text', 'Uma\nduas\ntrês');
 assert.equal(r.explicitLines, 3); assert.ok(r.advisory.includes('multiple-explicit-lines'));
 assert.deepEqual(r.issues, []);
});
test('dialogue candidate selection separates mission speech from inventory and objectives', () => {
 const f = 'interface/text/mission/single/05-eng/a.pot';
 for (const c of ['mission/single/05-eng/a/narrator/part01', 'mission/single/05-eng/a/[narrators]/officer/01', 'mission/single/05-eng/a/speech/soldier/01']) assert.ok(isSubtitleCandidate(f, c));
 assert.equal(isSubtitleCandidate(f, 'mission/single/05-eng/a/task1'), false);
 assert.equal(isSubtitleCandidate('interface/text/desc/desc_weapon_eng.pot', 'desc/weapon/narrator'), false);
});
test('non-display controls fail, but LF and tabs do not get deleted', () => {
 assert.deepEqual(analyzeReadability('A', 'A\nB\tC').issues, []);
 assert.deepEqual(analyzeReadability('A', 'A\u0000B').issues, ['non-display-control-character']);
});
test('root uses effective legacy sources and adds only explicit native dialogue bindings', () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-readable-test-'));
 const file = 'interface/text/mission/single/test/a.pot';
 try {
  for (const locale of ['en', 'pt_BR']) fs.mkdirSync(path.join(root, 'localization', locale, path.dirname(file)), {recursive: true});
  fs.writeFileSync(path.join(root, 'localization/en', file), 'msgctxt "mission/single/test/a/officer_last_wave"\nmsgid ""\nmsgstr "Forward!"\n');
  fs.writeFileSync(path.join(root, 'localization/pt_BR', file), 'msgctxt "mission/single/test/a/officer_last_wave"\nmsgid ""\nmsgstr "Avancem!"\n');
  assert.equal(checkReadabilityRoot(root).selectedDialogueAssociations, 0);
  const sourceHash = crypto.createHash('sha256').update('Forward!').digest('hex');
  const r = checkReadabilityRoot(root, {nativeDialogueContexts: [{file, context: 'mission/single/test/a/officer_last_wave', sourceHash}]});
  assert.equal(r.selectedDialogueAssociations, 1); assert.equal(r.records[0].source, 'Forward!');
  assert.equal(r.records[0].selection, 'native-indexed-dialogue-context'); assert.deepEqual(r.issues, []);
  const stale = checkReadabilityRoot(root, {nativeDialogueContexts: [{file, context: 'mission/single/test/a/officer_last_wave', sourceHash: '0'.repeat(64)}]});
  assert.ok(stale.issues.some(i => i.type === 'native-dialogue-source-drift'));
  assert.equal(stale.selectedDialogueAssociations, 0);
  const missingContext = checkReadabilityRoot(root, {nativeDialogueContexts: [{file, context: 'mission/single/test/a/deleted', sourceHash}]});
  assert.ok(missingContext.issues.some(i => i.type === 'native-dialogue-context-missing'));
  const missingCatalog = checkReadabilityRoot(root, {nativeDialogueContexts: [{file: 'interface/text/mission/single/test/deleted.pot', context: 'mission/single/test/deleted/01', sourceHash}]});
  assert.ok(missingCatalog.issues.some(i => i.type === 'native-dialogue-catalog-missing'));
  assert.throws(() => checkReadabilityRoot(root, {nativeDialogueContexts: [{file: '../outside.pot', context: 'x', sourceHash}]}));
  assert.throws(() => checkReadabilityRoot(root, {nativeDialogueContexts: [{file, context: 'x', sourceHash: 'broken'}]}), /Invalid native/);
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-readable-test-')));
  fs.rmSync(root, {recursive: true});
 }
});

test('binding a single legacy source does not reject other sources under the same context', () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-readable-legacy-'));
 const file = 'interface/text/mission/single/test/a.pot', context = 'mission/single/test/a/actor';
 try {
  for (const locale of ['en', 'pt_BR']) fs.mkdirSync(path.join(root, 'localization', locale, path.dirname(file)), {recursive: true});
  fs.writeFileSync(path.join(root, 'localization/en', file), `msgctxt "${context}"\nmsgid ""\nmsgstr "Forward!"\n\nmsgctxt "${context}"\nmsgid ""\nmsgstr "Hold!"\n`);
  fs.writeFileSync(path.join(root, 'localization/pt_BR', file), `msgctxt "${context}"\nmsgid "Forward!"\nmsgstr "Avancem!"\n\nmsgctxt "${context}"\nmsgid "Hold!"\nmsgstr "Mantenham a posição!"\n`);
  const sourceHash = crypto.createHash('sha256').update('Forward!').digest('hex');
  const r = checkReadabilityRoot(root, {nativeDialogueContexts: [{file, context, sourceHash}]});
  assert.equal(r.selectedDialogueAssociations, 1); assert.deepEqual(r.issues, []);
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-readable-legacy-')));
  fs.rmSync(root, {recursive: true});
 }
});

test('root rejects an empty inventory rather than approving zero checks', () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-readable-empty-'));
 try {
  fs.mkdirSync(path.join(root, 'localization/en'), {recursive: true});
  assert.throws(() => checkReadabilityRoot(root), /Empty source/);
 } finally {
  assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cta-readable-empty-')));
  fs.rmSync(root, {recursive: true});
 }
});
