import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog} from './translation-audit.mjs';

// GNU gettext's integer plural rule for Brazilian Portuguese. This repository
// currently has no msgid_plural entries; this does not certify engine behavior.
export const PT_BR_PLURAL = 'nplurals=2; plural=(n > 1);';
export const HEADER_FIELDS = {
  Language: 'pt_BR',
  'MIME-Version': '1.0',
  'Content-Type': 'text/plain; charset=UTF-8',
  'Content-Transfer-Encoding': '8bit',
  'Plural-Forms': PT_BR_PLURAL,
};

export function readHeaderFields(value) {
  const fields = new Map();
  for (const line of value.split('\n')) {
    if (!line) continue;
    const match = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/.exec(line);
    if (!match) throw new Error('Malformed catalog header field: ' + line);
    if (fields.has(match[1])) throw new Error('Duplicate catalog header field: ' + match[1]);
    fields.set(match[1], match[2]);
  }
  return fields;
}

// Flags precede msgctxt/msgid. Reading them separately also handles the inherited
// parser's omission of flags before an entry, without changing its source spans.
export function catalogFlags(text, entries = parseCatalog(text, '<flags>', {tolerant: true})) {
  const flags = new Map();
  const starts = new Set(entries.map(entry => entry.line));
  const physicalStrings = entries.flatMap(entry => entry.syntaxErrors
    .filter(problem => problem.error === 'physical-multiline-string')
    .map(problem => entry.spans[problem.field]).filter(Boolean));
  let pending = [];
  let current = null;
  let offset = text.startsWith('\uFEFF') ? 1 : 0;
  const attach = line => {
    if (line !== null && pending.length) {
      flags.set(line, [...(flags.get(line) || []), ...pending]);
      pending = [];
    }
  };
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/(?<=\n)/).entries()) {
    const line = raw.trim();
    const inString = physicalStrings.some(span => offset > span.start && offset < span.end);
    if (!inString) {
      if (starts.has(index + 1)) { current = index + 1; attach(current); }
      if (line.startsWith('#,')) pending.push(...line.slice(2).split(',').map(x => x.trim()).filter(Boolean));
      else if (/^msgstr(?:\[\d+\])?\s/.test(line) || line.startsWith('"')) attach(current);
      else if (!line) { attach(current); current = null; }
    }
    offset += raw.length;
  }
  attach(current);
  return flags;
}

export function checkCatalogMetadata(text, filename = '<catalog>') {
  const entries = parseCatalog(text, filename, {tolerant: true});
  const headers = entries.filter(entry => entry.header);
  const issues = [];
  const flags = catalogFlags(text, entries);
  if (headers.length !== 1) issues.push({type: 'header-count', expected: 1, actual: headers.length});
  if (headers.length === 1 && headers[0] !== entries[0]) issues.push({type: 'header-position', line: headers[0].line});
  for (const header of headers) {
    if (Object.keys(header.translations).join(',') !== 'msgstr') issues.push({type: 'header-translation-fields'});
    if (header.syntaxErrors.length) issues.push({type: 'header-syntax', errors: header.syntaxErrors});
    let fields;
    try { fields = readHeaderFields(header.translations.msgstr || ''); }
    catch (error) { issues.push({type: 'header-fields', message: error.message}); continue; }
    for (const [key, expected] of Object.entries(HEADER_FIELDS)) {
      if (fields.get(key) !== expected) issues.push({type: 'header-value', field: key, expected, actual: fields.get(key) ?? null});
    }
  }
  for (const entry of entries) {
    if ((flags.get(entry.line) || []).includes('fuzzy')) issues.push({type: entry.header ? 'fuzzy-header' : 'fuzzy-message', line: entry.line, context: entry.msgctxt});
    if (entry.header) continue;
    for (const [field, value] of Object.entries(entry.translations)) {
      if (value !== value.normalize('NFC')) issues.push({type: 'non-nfc-translation', context: entry.msgctxt, line: entry.line, field});
    }
    const plural = entry.msgid_plural !== undefined;
    const wanted = plural ? ['msgstr[0]', 'msgstr[1]'] : ['msgstr'];
    if (JSON.stringify(Object.keys(entry.translations).sort()) !== JSON.stringify(wanted)) {
      issues.push({type: 'translation-form-inventory', context: entry.msgctxt, line: entry.line, expected: wanted, actual: Object.keys(entry.translations)});
    }
    if (plural && wanted.some(key => !entry.translations[key])) issues.push({type: 'empty-plural-form', context: entry.msgctxt, line: entry.line});
  }
  return {headers: headers.length, messages: entries.filter(e => !e.header).length, pluralMessages: entries.filter(e => !e.header && e.msgid_plural !== undefined).length, issues};
}

// Pure planning helper: never writes files. Only the header and its fuzzy flag
// may change. All message bytes, other flags, comments, BOM and EOL are retained.
export function normalizeCatalogHeader(text, filename = '<catalog>') {
  const entries = parseCatalog(text, filename, {tolerant: true});
  const headers = entries.filter(entry => entry.header);
  if (headers.length > 1) throw new Error(filename + ': ambiguous catalog headers');
  const header = headers[0];
  if (header && header !== entries[0]) throw new Error(filename + ': header must precede all messages');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const changes = [];
  if (!header) {
    const bom = text.startsWith('\uFEFF') ? '\uFEFF' : '';
    const added = 'msgid ""' + eol + 'msgstr ""' + eol + Object.entries(HEADER_FIELDS)
      .map(([key, value]) => JSON.stringify(key + ': ' + value + '\n') + eol).join('') + eol;
    return {text: bom + added + text.slice(bom.length), changes: [{field: 'header', before: null, after: HEADER_FIELDS}]};
  }
  if (header.syntaxErrors.length || Object.keys(header.translations).join(',') !== 'msgstr') throw new Error(filename + ': cannot normalize malformed header');
  const value = header.translations.msgstr || '';
  const fields = readHeaderFields(value);
  let next = value;
  for (const [key, expected] of Object.entries(HEADER_FIELDS)) {
    if (fields.get(key) === expected) continue;
    changes.push({field: key, before: fields.get(key) ?? null, after: expected});
    if (fields.has(key)) next = next.replace(new RegExp('^' + key + ':.*(?:\\n|$)', 'm'), key + ': ' + expected + '\n');
    else next += (next && !next.endsWith('\n') ? '\n' : '') + key + ': ' + expected + '\n';
  }
  const prefix = text.slice(0, header.start);
  const cleanedPrefix = prefix.replace(/(^|\n)(\uFEFF?)[ \t]*#,[^\r\n]*(?:\r?\n|$)/g, (line, leading, bom) => {
    const match = /#,([^\r\n]*)/.exec(line);
    const existing = match[1].split(',').map(x => x.trim()).filter(Boolean);
    if (!existing.includes('fuzzy')) return line;
    changes.push({field: 'header-flags', before: existing, after: existing.filter(x => x !== 'fuzzy')});
    const remaining = existing.filter(x => x !== 'fuzzy');
    return leading + bom + (remaining.length ? '#, ' + remaining.join(', ') + eol : '');
  });
  const span = header.spans.msgstr;
  const rendered = next === value ? text.slice(span.start, span.end) : 'msgstr ""' + eol + next.split(/(?<=\n)/).filter(Boolean).map(line => JSON.stringify(line) + eol).join('');
  const result = cleanedPrefix + text.slice(header.start, span.start) + rendered + text.slice(span.end);
  if (JSON.stringify(messageRecords(text, entries)) !== JSON.stringify(messageRecords(result, parseCatalog(result, filename, {tolerant: true})))) throw new Error(filename + ': header normalization changed a message');
  return {text: result, changes};
}

function messageIdentity(entry) {
  return [entry.msgctxt, entry.msgid, entry.msgid_plural ?? null, entry.translations];
}

function messageRecords(text, entries) {
  const flags = catalogFlags(text, entries);
  return entries.filter(e => !e.header).map(entry => [...messageIdentity(entry), flags.get(entry.line) || []]);
}

export function checkMetadataRoot(root) {
  const issues = [];
  const inventory = [];
  let pluralMessages = 0;
  function walk(folder) {
    for (const item of fs.readdirSync(folder, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(folder, item.name);
      if (item.isSymbolicLink()) throw new Error('Catalog symlink is not allowed: ' + file);
      if (item.isDirectory()) { walk(file); continue; }
      if (!item.name.endsWith('.pot')) continue;
      if (!item.isFile()) throw new Error('Non-regular catalog: ' + file);
      const relative = path.relative(root, file).split(path.sep).join('/');
      const text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(fs.readFileSync(file));
      const result = checkCatalogMetadata(text, relative);
      inventory.push(relative);
      pluralMessages += result.pluralMessages;
      issues.push(...result.issues.map(issue => ({file: relative, ...issue})));
    }
  }
  walk(root);
  if (!inventory.length) throw new Error('Empty translated catalog inventory');
  return {catalogs: inventory.length, pluralMessages, issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') !== '--check') throw new Error('Use: node tools/catalog-metadata.mjs --check');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = checkMetadataRoot(path.join(repo, 'localization/pt_BR'));
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length) process.exitCode = 1;
}
