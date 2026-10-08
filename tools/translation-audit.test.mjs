import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditRoots, effectiveSource, indexCatalog, parseCatalog, printfArguments, protectedTokens, replaceTranslation } from './translation-audit.mjs';

test('parses multiline strings, escaped names, CRLF, headers and plural forms', () => {
  const catalog = '#, fuzzy\r\nmsgid ""\r\nmsgstr ""\r\n"Language: pt_BR\\n"\r\n\r\n' +
    'msgctxt "names/test"\r\nmsgid "John\\n"\r\n"Jerry\\n"\r\nmsgstr "John\\nJerry\\n"\r\n\r\n' +
    'msgctxt "count"\r\nmsgid "%d unit"\r\nmsgid_plural "%d units"\r\nmsgstr[0] "%d unidade"\r\nmsgstr[1] "%d unidades"\r\n';
  const entries = parseCatalog(catalog);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].header, true);
  assert.equal(entries[1].msgid, 'John\nJerry\n');
  assert.equal(entries[2].translations['msgstr[1]'], '%d unidades');
});

test('preserves conflicting or repeated identifiers for explicit review', () => {
  const entries = parseCatalog('msgctxt "x"\nmsgid "A"\nmsgstr "a"\n\nmsgctxt "x"\nmsgid "A"\nmsgstr "b"\n\nmsgctxt "x"\nmsgid "B"\nmsgstr "c"\n');
  const group = indexCatalog(entries).get('x');
  assert.equal(group.size, 2);
  assert.equal(group.get('["A",null]').length, 2);
});

test('checks token multiplicity and permits reordered positional placeholders', () => {
  assert.notDeepEqual(protectedTokens('%s %s %d'), protectedTokens('%s %d %d'));
  assert.deepEqual(protectedTokens('%1% <c(red)>%2%</c>'), protectedTokens('%2% <c(red)>%1%</c>'));
  assert.deepEqual(protectedTokens('Canhão<x(175)>%1%'), protectedTokens('Canhão<x(195)>%1%'));
  assert.deepEqual(protectedTokens('100% de precisão, <<untitled>'), []);
  assert.deepEqual(protectedTokens('Alcance#<x(%i)>%.f m'), ['%.f', '<x(%i)>']);
  assert.notDeepEqual(printfArguments('%s %d'), printfArguments('%d %s'));
  assert.deepEqual(printfArguments('%1% %2$s %d'), ['%d']);
});

test('edits only the exact contextual translation and keeps names intact', () => {
  const text = 'msgctxt "names/first"\nmsgid "Jerry"\nmsgstr "Jerry"\n\n' +
    'msgctxt "mission/officer"\nmsgid "Jerry is coming!"\nmsgstr "O Jerry está chegando!"\n';
  const result = replaceTranslation(text, 'mission/officer', 'Jerry is coming!', 'O Jerry está chegando!', 'Os alemães estão chegando!');
  assert.match(result, /msgstr "Jerry"/);
  assert.match(result, /msgstr "Os alemães estão chegando!"/);
  assert.throws(() => replaceTranslation(text, 'mission/officer', 'Jerry is coming!', 'stale translation', 'Novo texto'), /exactly one/);
});

test('keeps source spans aligned when a catalog starts with a UTF-8 BOM', () => {
  const text = '\uFEFFmsgctxt "x"\nmsgid "Hello"\nmsgstr "Oi"\n';
  const result = replaceTranslation(text, 'x', 'Hello', 'Oi', 'Olá');
  assert.equal(result, '\uFEFFmsgctxt "x"\nmsgid "Hello"\nmsgstr "Olá"\n');
});

test('rejects malformed strings instead of returning a partial catalog', () => {
  assert.throws(() => parseCatalog('msgctxt "x"\nmsgid "broken\nmsgstr ""\n'), /syntax|quoted/);
});

test('recognizes source text in msgstr without confusing genuinely empty entries', () => {
  const entries = parseCatalog('msgctxt "engine/error"\nmsgid ""\nmsgstr "(Warning) Error"\n\nmsgctxt "empty"\nmsgid ""\nmsgstr ""\n');
  assert.equal(effectiveSource(entries[0]), '(Warning) Error');
  assert.equal(effectiveSource(entries[1]), '');
});

test('records inherited malformed fields and duplicate empty msgid for diagnostics', () => {
  const entries = parseCatalog('msgctxt "x"\nmsgid ""\nmsgid ""\nmsgstr ""4\n', 'test', { tolerant: true });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].syntaxErrors.length, 2);
  assert.equal(entries[0].msgctxt, 'x');
});

test('reads physical multiline fields completely without truncating their source', () => {
  const entries = parseCatalog('msgctxt "x"\nmsgid "First line\nSecond line"\nmsgstr "Primeira linha\nSegunda linha"\n', 'test', { tolerant: true });
  assert.equal(entries[0].msgid, 'First line\nSecond line');
  assert.equal(entries[0].translations.msgstr, 'Primeira linha\nSegunda linha');
  assert.equal(entries[0].syntaxErrors[0].error, 'physical-multiline-string');
});

test('does not reinterpret an already escaped backslash in a path or name', () => {
  const entries = parseCatalog('msgctxt "x"\nmsgid "C:\\\\Temp"\nmsgstr "C:\\\\Temp"\n', 'test', { tolerant: true });
  assert.equal(entries[0].msgid, 'C:\\Temp');
  assert.equal(entries[0].syntaxErrors.length, 0);
});

test('recognizes composite game tags and ignores ordinary bracketed text', () => {
  assert.deepEqual(protectedTokens('<f(pobeda)s(27)b>Olá<x.y.>'), ['<f(pobeda)s(27)b>', '<x.y.>']);
  assert.deepEqual(protectedTokens('<<untitled> and 25% de chance'), []);
});

test('changed fallback sources require matching review evidence against an older baseline', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-audit-test-'));
  try {
    for (const folder of ['old', 'new', 'pt']) fs.mkdirSync(path.join(fixture, folder));
    fs.writeFileSync(path.join(fixture, 'old/test.pot'), 'msgctxt "error"\nmsgid ""\nmsgstr "Old warning"\n');
    fs.writeFileSync(path.join(fixture, 'new/test.pot'), 'msgctxt "error"\nmsgid ""\nmsgstr "New warning"\n');
    fs.writeFileSync(path.join(fixture, 'pt/test.pot'), 'msgctxt "error"\nmsgid ""\nmsgstr "Novo aviso"\n');
    const roots = ['old', 'pt', 'new'].map(folder => path.join(fixture, folder));
    const stale = auditRoots(...roots);
    assert.equal(stale.counts.changed, 1);
    assert.equal(stale.counts.needsTranslationReview, 1);
    const confirmed = auditRoots(...roots, {
      reviewedTranslations: [{ file: 'test.pot', context: 'error', source: '', sourceText: 'New warning', translation: 'Novo aviso' }],
    });
    assert.equal(confirmed.counts.changed, 1);
    assert.equal(confirmed.counts.needsTranslationReview, 0);
  } finally {
    assert.ok(fixture.startsWith(path.join(os.tmpdir(), 'cta-audit-test-')));
    fs.rmSync(fixture, { recursive: true });
  }
});
