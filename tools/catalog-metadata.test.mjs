import test from 'node:test';
import assert from 'node:assert/strict';
import {HEADER_FIELDS, PT_BR_PLURAL, catalogFlags, checkCatalogMetadata, normalizeCatalogHeader, readHeaderFields} from './catalog-metadata.mjs';

const body = 'msgctxt "desc/test"\nmsgid "Tank %1%"\n#, boost-format\nmsgstr "Tanque %1%"\n';
const complete = 'msgid ""\nmsgstr ""\n' + Object.entries(HEADER_FIELDS).map(([key, value]) => JSON.stringify(key + ': ' + value + '\n') + '\n').join('') + '\n';

test('canonical Brazilian header passes and repeated normalization is byte-identical', () => {
  assert.deepEqual(checkCatalogMetadata(complete + body).issues, []);
  assert.equal(normalizeCatalogHeader(complete + body).text, complete + body);
  assert.deepEqual(normalizeCatalogHeader(complete + body).changes, []);
  assert.equal(PT_BR_PLURAL, 'nplurals=2; plural=(n > 1);');
});

test('English language, template plural and header fuzzy are diagnosed and normalized only in the header', () => {
  const old = '#. Preserve comment\n#, fuzzy\n' + complete.replace('pt_BR', 'en').replace(PT_BR_PLURAL, 'nplurals=INTEGER; plural=EXPRESSION;') + body;
  const result = normalizeCatalogHeader(old);
  assert.equal(checkCatalogMetadata(result.text).issues.length, 0);
  assert.ok(result.text.endsWith(body));
  assert.ok(result.text.startsWith('#. Preserve comment\n'));
  assert.equal(result.changes.length, 3);
});

test('header fuzzy cleanup preserves BOM, CRLF and unrelated format flags', () => {
  const old = '\uFEFF#, fuzzy, c-format\r\n' + (complete + body).replaceAll('\n', '\r\n');
  const result = normalizeCatalogHeader(old);
  assert.ok(result.text.startsWith('\uFEFF#, c-format\r\n'));
  assert.ok(result.text.endsWith(body.replaceAll('\n', '\r\n')));
  assert.equal(checkCatalogMetadata(result.text).issues.length, 0);
  assert.equal(normalizeCatalogHeader(result.text).text, result.text);
});

test('absent header is added before the first message without touching message bytes', () => {
  for (const bom of ['', '\uFEFF']) {
    const result = normalizeCatalogHeader(bom + body);
    assert.ok(result.text.startsWith(bom + 'msgid ""\n'));
    assert.ok(result.text.endsWith(body));
    assert.equal(checkCatalogMetadata(result.text).issues.length, 0);
    assert.equal(result.changes.length, 1);
  }
});

test('a fuzzy message is diagnosed, never silently approved by header cleanup', () => {
  const text = '#, fuzzy\n' + complete + '#, fuzzy, boost-format\n' + body;
  const result = normalizeCatalogHeader(text);
  const issues = checkCatalogMetadata(result.text).issues;
  assert.equal(issues.filter(i => i.type === 'fuzzy-message').length, 1);
  assert.ok(result.text.endsWith('#, fuzzy, boost-format\n' + body));
});

test('duplicate, multiple or malformed headers are refused rather than overwritten', () => {
  assert.throws(() => readHeaderFields('Language: en\nLanguage: pt_BR\n'), /Duplicate/);
  assert.throws(() => readHeaderFields('bad header'), /Malformed/);
  assert.throws(() => normalizeCatalogHeader(complete + complete + body), /ambiguous/);
  assert.throws(() => normalizeCatalogHeader(complete.replace('"Language: pt_BR\\n"', '"Language: en\\nLanguage: pt_BR\\n"') + body), /Duplicate/);
  assert.throws(() => normalizeCatalogHeader('msgid ""\nmsgstr "Broken\n' + body), /malformed header/);
});

test('all plural forms and no singular/plural mixture are required', () => {
  const entry = 'msgctxt "count"\nmsgid "%d unit"\nmsgid_plural "%d units"\nmsgstr[0] "%d unidade"\nmsgstr[1] "%d unidades"\n';
  assert.equal(checkCatalogMetadata(complete + entry).issues.length, 0);
  assert.ok(checkCatalogMetadata(complete + entry.replace('msgstr[1] "%d unidades"\n', '')).issues.some(i => i.type === 'translation-form-inventory'));
  assert.ok(checkCatalogMetadata(complete + entry.replace('msgstr[1] "%d unidades"', 'msgstr[1] ""')).issues.some(i => i.type === 'empty-plural-form'));
  assert.ok(checkCatalogMetadata(complete + body + 'msgstr[0] "Extra"\n').issues.some(i => i.type === 'translation-form-inventory'));
});

test('flags before msgctxt and msgid are associated with the right entry, including BOM', () => {
  const flags = catalogFlags('\uFEFF#, fuzzy\nmsgid ""\nmsgstr ""\n\n#, boost-format, c-format\nmsgctxt "x"\nmsgid "Tank"\nmsgstr "Tanque"\n');
  assert.deepEqual(flags.get(2), ['fuzzy']);
  assert.deepEqual(flags.get(6), ['boost-format', 'c-format']);
});

test('inline fuzzy after msgctxt, msgid or msgstr belongs to that message and does not leak', () => {
  for (const first of [
    'msgctxt "a"\n#, fuzzy\nmsgid "A"\nmsgstr "A"\n',
    'msgctxt "a"\nmsgid "A"\n#, fuzzy\nmsgstr "A"\n',
    'msgctxt "a"\nmsgid "A"\nmsgstr "A"\n#, fuzzy\n',
  ]) {
    const next = 'msgctxt "b"\nmsgid "B"\nmsgstr "B"\n';
    for (const tail of ['', '\n' + next]) {
      const issues = checkCatalogMetadata(complete + first + tail).issues.filter(i => i.type === 'fuzzy-message');
      assert.equal(issues.length, 1);
      assert.equal(issues[0].context, 'a');
    }
    assert.ok(normalizeCatalogHeader('#, fuzzy\n' + complete + first).text.endsWith(first));
  }
});

test('a late header cannot clear a preceding message flag', () => {
  const text = '#, fuzzy\n' + body + '\n' + complete;
  assert.throws(() => normalizeCatalogHeader(text), /precede all messages/);
  assert.ok(checkCatalogMetadata(text).issues.some(i => i.type === 'header-position'));
  assert.ok(checkCatalogMetadata(text).issues.some(i => i.type === 'fuzzy-message'));
});

test('literal fuzzy-looking text in a physical multiline string is not a workflow flag', () => {
  const literal = 'msgctxt "literal"\nmsgid "Line\n#, fuzzy\nEnd"\nmsgstr "Linha\n#, fuzzy\nFim"\n';
  assert.deepEqual(checkCatalogMetadata(complete + literal).issues, []);
  assert.equal(normalizeCatalogHeader(complete + literal).text, complete + literal);
});

test('numbered optional Poedit header fields remain valid and are preserved', () => {
  const text = complete.replace('\n\n', '\n"X-Poedit-SearchPath-0: .\\n"\n\n') + body;
  assert.deepEqual(checkCatalogMetadata(text).issues, []);
  assert.equal(normalizeCatalogHeader(text).text, text);
});

test('decomposed Portuguese accents are diagnosed without silently rewriting messages or source', () => {
  const text = complete + 'msgctxt "cap"\nmsgid "Aviation"\nmsgstr "Aviac\u0327a\u0303o"\n';
  assert.ok(checkCatalogMetadata(text).issues.some(i => i.type === 'non-nfc-translation'));
  assert.equal(normalizeCatalogHeader(text).text, text);
  assert.deepEqual(checkCatalogMetadata(text.replace('Aviac\u0327a\u0303o', 'Aviação')).issues, []);
});
