import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reads gettext catalogs without flattening entries or losing their source spans.
// The game uses .pot files containing both msgid and translated msgstr fields.
export function parseCatalog(text, filename = '<catalog>', { tolerant = false } = {}) {
  const lines = text.replace(/^\uFEFF/, '').split(/(?<=\n)/);
  const entries = [];
  let entry = null;
  let active = null;
  let offset = text.startsWith('\uFEFF') ? 1 : 0;
  const finish = () => {
    if (entry && Object.hasOwn(entry, 'msgid')) {
      entry.end = offset;
      entry.header = !entry.msgctxt && !entry.msgid;
      entries.push(entry);
    }
    entry = null;
    active = null;
  };
  const decode = (value, line) => {
    try {
      if (tolerant && /\r?\n/.test(value)) {
        entry.syntaxErrors.push({ line, field: active, value, error: 'physical-multiline-string' });
        value = value.replace(/\r?\n/g, '\\n');
      }
      let unknownEscape = false;
      const safeValue = value.replace(/\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|\\(.)/g, (whole, unknown) => {
        if (unknown === undefined) return whole;
        unknownEscape = true;
        return '\\\\' + unknown;
      });
      if (tolerant && unknownEscape) {
        entry.syntaxErrors.push({ line, field: active, value, error: 'literal-backslash' });
        value = safeValue;
      }
      const decoded = JSON.parse(value);
      if (typeof decoded !== 'string') throw new Error('Expected quoted text');
      return decoded;
    } catch {
      if (tolerant && entry) {
        entry.syntaxErrors.push({ line, field: active, value, error: 'invalid-quoted-string' });
        return value.endsWith('"') ? value.slice(1, -1) : value.slice(1);
      }
      throw new Error(filename + ':' + line + ': invalid quoted string: ' + value);
    }
  };
  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i];
    const line = raw.trim();
    if (!line) {
      finish();
    } else if (line.startsWith('#') || line.startsWith(';')) {
      // Obsolete entries (#~) are comments, never active translation candidates.
      if (line.startsWith('#,') && entry) entry.flags.push(line.slice(2).trim());
    } else {
      const match = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(.+)$/.exec(line);
      if (match) {
        const field = match[1];
        const firstLine = i + 1;
        // Some original game catalogs use physically multiline quoted fields.
        // Read the complete field before diagnosing, rather than truncating it.
        const closed = value => /(?:^|[^\\])(?:\\\\)*"$/.test(value) && value !== '"';
        if (tolerant && match[2].startsWith('"') && !closed(match[2])) {
          let value = match[2];
          while (i + 1 < lines.length && !closed(value)) {
            const following = lines[i + 1].replace(/\r?\n$/, '');
            if (/^(msgctxt|msgid|msgstr)\s/.test(following.trim())) break;
            i++;
            value += '\n' + following;
            raw += lines[i];
          }
          match[2] = value;
        }
        if (entry && field === 'msgid' && active === 'msgid' && entry.msgid === '' && match[2] === '""') {
          if (!tolerant) throw new Error(filename + ':' + (i + 1) + ': duplicate msgid field');
          entry.syntaxErrors.push({ line: i + 1, field, value: match[2], error: 'duplicate-field' });
          offset += raw.length;
          continue;
        }
        if (entry && field.startsWith('msgstr') && Object.hasOwn(entry.translations, field)) {
          if (!tolerant) throw new Error(filename + ':' + firstLine + ': duplicate ' + field + ' field');
          entry.syntaxErrors.push({ line: firstLine, field, value: match[2], error: 'duplicate-field' });
          // Keep the first value/span for diagnostics, never silently last-write-wins.
          // Continuations of the duplicate must not be appended to the first value.
          active = null;
          offset += raw.length;
          continue;
        }
        if (entry && (field === 'msgctxt' || (field === 'msgid' && Object.hasOwn(entry, 'msgid')))) {
          finish();
        }
        entry ??= { msgctxt: '', translations: {}, spans: {}, flags: [], syntaxErrors: [], start: offset, line: firstLine };
        active = field;
        const value = decode(match[2], firstLine);
        if (field.startsWith('msgstr')) entry.translations[field] = value;
        else entry[field] = value;
        entry.spans[field] = { start: offset, end: offset + raw.length };
      } else if (line.startsWith('"') && active && entry) {
        const value = decode(line, i + 1);
        if (active.startsWith('msgstr')) entry.translations[active] += value;
        else entry[active] += value;
        entry.spans[active].end = offset + raw.length;
      } else {
        if (tolerant && entry) {
          entry.syntaxErrors.push({ line: i + 1, value: line, error: 'unrecognized-syntax' });
          active = null;
          offset += raw.length;
          continue;
        }
        throw new Error(filename + ':' + (i + 1) + ': unrecognized catalog syntax: ' + line);
      }
    }
    offset += raw.length;
  }
  finish();
  return entries;
}

export function sourceSignature(entry) {
  return JSON.stringify([entry.msgid, entry.msgid_plural ?? null]);
}

export function effectiveSource(entry) {
  // A few engine messages have an empty msgid and their English source in msgstr.
  return entry.msgid || entry.translations.msgstr || '';
}

// Physical multiline fields and literal backslashes are inherited game formats:
// report them, but do not turn those diagnostics into new blocking exceptions.
export const actionableCatalogSyntax = problem =>
  ['invalid-quoted-string', 'unrecognized-syntax', 'duplicate-field'].includes(problem.error);

// Select by context AND exact English source. Empty legacy msgid values are not
// an identity when that context contains different effective English texts.
// A Portuguese msgid spelling out the exact English text is a safe explicit key.
export function matchCatalogTranslation(englishEntries, portugueseEntries, context, source) {
  const originals = englishEntries.filter(e => !e.header && e.msgctxt === context && effectiveSource(e) === source);
  const signatures = [...new Set(originals.map(sourceSignature))];
  if (signatures.length !== 1) return { originals, matches: [], ambiguousEmptySource: false };
  const signature = signatures[0], original = originals[0];
  const legacy = !original.msgid;
  const related = englishEntries.filter(e => !e.header && e.msgctxt === context && sourceSignature(e) === signature);
  const ambiguousEmptySource = legacy && new Set(related.map(effectiveSource)).size > 1;
  const matches = portugueseEntries.filter(e => !e.header && e.msgctxt === context && (
    (sourceSignature(e) === signature && !ambiguousEmptySource) ||
    (legacy && source && e.msgid === source && (e.msgid_plural ?? null) === (original.msgid_plural ?? null))
  ));
  return { originals, signature, matches, ambiguousEmptySource };
}

export function indexCatalog(entries) {
  const contexts = new Map();
  for (const entry of entries.filter(item => !item.header)) {
    const context = entry.msgctxt || '';
    if (!contexts.has(context)) contexts.set(context, new Map());
    const group = contexts.get(context);
    const signature = sourceSignature(entry);
    if (!group.has(signature)) group.set(signature, []);
    group.get(signature).push(entry);
  }
  return contexts;
}

export function protectedTokens(text) {
  // Counts occurrences, so %s %s cannot silently become %s %d.
  const tokens = text.match(/<(?:\/[cfsempxy]|(?:[cfsempxy](?:\(|[.+-])|b(?:\+|(?=>)))[^<>\n]*)>|%\d+%|%(?:\d+\$)?[-+#0']*\d*(?:\.\d*)?[sdifuxX]|\{[A-Za-z_][A-Za-z_0-9]*\}/g) || [];
  // Numeric offsets may be adjusted to fit Portuguese labels; keep their count.
  return tokens.map(token => token.replace(/^<([xy])\(-?\d+(?:\.\d+)?\)>$/, '<$1()>')).sort();
}

export function printfArguments(text) {
  // Unlike %1% / %2$s, ordinary printf placeholders consume arguments in order.
  return (text.replace(/%\d+%/g, '').match(/%(?!\d+\$)[-+#0']*\d*(?:\.\d*)?[sdifuxX]/g) || []);
}

function catalogFiles(root) {
  const found = [];
  function walk(folder) {
    for (const child of fs.readdirSync(folder, { withFileTypes: true })) {
      const absolute = path.join(folder, child.name);
      if (child.isDirectory()) walk(absolute);
      else if (child.name.endsWith('.pot')) found.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  walk(root);
  return found.sort();
}

function readCatalog(root, relative) {
  const filename = path.join(root, relative);
  if (!fs.existsSync(filename)) return { text: '', entries: [], index: new Map() };
  const text = fs.readFileSync(filename, 'utf8');
  const entries = parseCatalog(text, filename, { tolerant: true });
  return { text, entries, index: indexCatalog(entries) };
}

function flatEntries(catalog) {
  return [...catalog.index.values()].flatMap(group => [...group.values()].flatMap(items => {
    const seen = new Set();
    return items.filter(item => {
      const source = effectiveSource(item);
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });
  }));
}

function translationsAt(catalog, context) {
  const group = catalog.index.get(context);
  return group ? [...group.values()].flat().map(item => ({
    source: item.msgid,
    plural: item.msgid_plural ?? null,
    translations: item.translations,
    line: item.line,
  })) : [];
}

function countDuplicates(catalog) {
  return [...catalog.index].flatMap(([context, group]) =>
    [...group.values()].filter(items => items.length > 1).map(items => ({
      context, source: items[0].msgid, occurrences: items.length,
      conflictingTranslations: new Set(items.map(item => JSON.stringify(item.translations))).size > 1,
    })));
}

export function auditRoots(oldRoot, translatedRoot, incomingRoot, { sourceExceptions = [], reviewedTranslations = [] } = {}) {
  const oldFiles = catalogFiles(oldRoot);
  const translatedFiles = catalogFiles(translatedRoot);
  const incomingFiles = catalogFiles(incomingRoot);
  const allFiles = [...new Set([...oldFiles, ...translatedFiles, ...incomingFiles])].sort();
  const report = {
    schemaVersion: 1,
    files: { previousEnglish: oldFiles.length, portuguese: translatedFiles.length, currentEnglish: incomingFiles.length },
    counts: { unchanged: 0, added: 0, changed: 0, removed: 0, translatedExact: 0, needsTranslationReview: 0 },
    addedFiles: incomingFiles.filter(file => !oldFiles.includes(file)),
    removedFiles: oldFiles.filter(file => !incomingFiles.includes(file)),
    changedFiles: [],
    changes: [],
    removedEntries: [],
    issues: [],
    duplicates: [],
    sourceExceptionsUsed: [],
  };
  for (const relative of allFiles) {
    const old = readCatalog(oldRoot, relative);
    const translated = readCatalog(translatedRoot, relative);
    const incoming = readCatalog(incomingRoot, relative);
    const fileCounts = { unchanged: 0, added: 0, changed: 0, removed: 0 };
    for (const [language, catalog] of [['previousEnglish', old], ['portuguese', translated], ['currentEnglish', incoming]]) {
      for (const entry of catalog.entries) {
        for (const problem of entry.syntaxErrors) {
          report.issues.push({ type: 'catalog-syntax-error', file: relative, language, context: entry.msgctxt, ...problem });
        }
      }
      for (const duplicate of countDuplicates(catalog)) {
        report.duplicates.push({ file: relative, language, ...duplicate });
      }
    }
    for (const next of flatEntries(incoming)) {
      const previousGroup = old.index.get(next.msgctxt || '');
      const signature = sourceSignature(next);
      const previous = previousGroup?.get(signature)?.find(item => effectiveSource(item) === effectiveSource(next));
      const type = previous ? 'unchanged' : previousGroup ? 'changed' : 'added';
      fileCounts[type]++;
      report.counts[type]++;
      if (!translated.index.has(next.msgctxt || '')) {
        report.issues.push({ type: 'missing-context', file: relative, context: next.msgctxt });
      }
      const translatedGroup = translated.index.get(next.msgctxt || '');
      const exactTranslations = matchCatalogTranslation(incoming.entries, translated.entries, next.msgctxt, effectiveSource(next)).matches;
      for (const exception of sourceExceptions.filter(item =>
        item.file === relative && item.context === next.msgctxt && item.englishSource === next.msgid)) {
        const accepted = [...(translatedGroup?.values() || [])].flat().filter(item => item.msgid === exception.acceptedPortugueseSource);
        if (accepted.length) {
          exactTranslations.push(...accepted);
          report.sourceExceptionsUsed.push({ file: relative, context: next.msgctxt, reason: exception.reason });
        }
      }
      const exact = exactTranslations.find(item => {
        const reviewedFallback = reviewedTranslations.some(review =>
          review.file === relative && review.context === next.msgctxt &&
          review.source === next.msgid && review.sourceText === effectiveSource(next) &&
          review.translation === item.translations.msgstr);
        return !(type === 'changed' && !next.msgid && !item.msgid && !reviewedFallback) &&
          !item.syntaxErrors.some(actionableCatalogSyntax) &&
          Object.values(item.translations).some(Boolean);
      });
      if (exact) report.counts.translatedExact++;
      else if (effectiveSource(next) || next.msgid_plural) report.counts.needsTranslationReview++;
      if (type !== 'unchanged') report.changes.push({
        file: relative, context: next.msgctxt, type,
        source: next.msgid, sourceText: effectiveSource(next), plural: next.msgid_plural ?? null,
        previousSources: previousGroup ? [...new Set([...previousGroup.values()].flat().map(effectiveSource))] : [],
        previousTranslations: translationsAt(translated, next.msgctxt || ''),
        alreadyTranslatedExact: !!exact,
        ambiguousContext: [incoming.index.get(next.msgctxt || ''), previousGroup].some(group =>
          group && new Set([...group.values()].flat().map(item => JSON.stringify([sourceSignature(item), effectiveSource(item)]))).size > 1),
      });
      if (exact) {
        const fields = Object.keys(exact.translations);
        for (const field of fields) {
          const target = exact.translations[field];
          if (!target || !effectiveSource(next)) continue;
          const source = /\[[1-9]/.test(field) ? (next.msgid_plural || effectiveSource(next)) : effectiveSource(next);
          const before = protectedTokens(source);
          const after = protectedTokens(target);
          if (JSON.stringify(before) !== JSON.stringify(after)) {
            report.issues.push({ type: 'protected-token-mismatch', file: relative, context: next.msgctxt, field, source, translation: target, expected: before, actual: after });
          }
          if (JSON.stringify(printfArguments(source)) !== JSON.stringify(printfArguments(target))) {
            report.issues.push({ type: 'printf-argument-order-mismatch', file: relative, context: next.msgctxt, field, source, translation: target });
          }
          if (target === source && !relative.includes('/names/')) {
            report.issues.push({ type: 'same-as-source-review', file: relative, context: next.msgctxt, source, translation: target });
          }
        }
      } else if (effectiveSource(next) || next.msgid_plural) {
        report.issues.push({ type: 'no-exact-translation', file: relative, context: next.msgctxt, source: next.msgid, sourceText: effectiveSource(next), sourceChange: type });
      }
    }
    for (const previous of flatEntries(old)) {
      const nextGroup = incoming.index.get(previous.msgctxt || '');
      if (!nextGroup) {
        fileCounts.removed++;
        report.counts.removed++;
        report.removedEntries.push({ file: relative, context: previous.msgctxt, source: previous.msgid });
      }
    }
    for (const context of translated.index.keys()) {
      if (!incoming.index.has(context)) report.issues.push({ type: 'unexpected-context', file: relative, context });
    }
    if (fileCounts.added || fileCounts.changed || fileCounts.removed) report.changedFiles.push({ file: relative, ...fileCounts });
  }
  return report;
}

export function replaceTranslation(text, context, source, expected, replacement, filename = '<catalog>') {
  const matches = parseCatalog(text, filename, { tolerant: true }).filter(entry =>
    !entry.header && entry.msgctxt === context && entry.msgid === source &&
    entry.translations.msgstr === expected);
  if (matches.length !== 1) throw new Error(filename + ': expected exactly one matching translation for ' + context + ', got ' + matches.length);
  if (matches[0].syntaxErrors.some(actionableCatalogSyntax)) throw new Error(filename + ': invalid Portuguese catalog syntax: ' + context);
  const span = matches[0].spans.msgstr;
  if (!span) throw new Error(filename + ': missing singular msgstr: ' + context);
  if (JSON.stringify(protectedTokens(source)) !== JSON.stringify(protectedTokens(replacement))) {
    throw new Error(filename + ': replacement changes protected tokens: ' + context);
  }
  return text.slice(0, span.start) + 'msgstr ' + JSON.stringify(replacement) + '\n' + text.slice(span.end);
}

function main() {
  const args = process.argv.slice(2);
  const options = Object.fromEntries(args.reduce((pairs, arg, i) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), args[i + 1]]);
    return pairs;
  }, []));
  const repo = path.resolve(options.repo || '.');
  const incoming = path.resolve(repo, options.incoming || 'localization/en');
  const exceptionsFile = path.join(repo, 'translation/source-exceptions.json');
  const sourceExceptions = fs.existsSync(exceptionsFile) ? JSON.parse(fs.readFileSync(exceptionsFile, 'utf8')) : [];
  const reviewFolder = path.join(repo, 'translation');
  const reviewedTranslations = fs.existsSync(reviewFolder) ? fs.readdirSync(reviewFolder)
    .filter(name => /^(?:reviewed|full-review|final-review)-\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .flatMap(name => {
      const record = JSON.parse(fs.readFileSync(path.join(reviewFolder, name), 'utf8'));
      if (name.startsWith('full-review-') || name.startsWith('final-review-')) {
        // Unapplied proposals must not be accepted as proof of a translation.
        return record.application?.status === 'applied' ? (record.changes || [])
          .map(change => ({ ...change, source: change.sourceMessageId ?? change.source, translation: change.after })) : [];
      }
      return record.reviews || [];
    }) : [];
  const previous = path.resolve(repo, options.previous || 'localization/en');
  const report = auditRoots(previous, path.join(repo, 'localization/pt_BR'), incoming, { sourceExceptions, reviewedTranslations });
  if (options.output) {
    const output = path.resolve(repo, options.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }
  const issuesByType = {};
  for (const issue of report.issues) issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
  console.log(JSON.stringify({
    files: report.files, counts: report.counts,
    addedFiles: report.addedFiles, removedFiles: report.removedFiles,
    changedFiles: report.changedFiles, issuesByType,
    duplicates: report.duplicates.length,
    sourceExceptionsUsed: report.sourceExceptionsUsed.length,
  }, null, 2));
  if (Object.hasOwn(options, 'check')) {
    const errors = report.issues.filter(issue =>
      ['no-exact-translation', 'protected-token-mismatch', 'printf-argument-order-mismatch', 'missing-context', 'unexpected-context'].includes(issue.type) ||
      (issue.type === 'catalog-syntax-error' && issue.language === 'portuguese' &&
        actionableCatalogSyntax(issue)));
    const duplicateErrors = report.duplicates.filter(item => item.language === 'portuguese' && item.conflictingTranslations);
    if (errors.length || duplicateErrors.length) {
      console.error('Translation validation failed: ' + (errors.length + duplicateErrors.length) + ' actionable issue(s).');
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
