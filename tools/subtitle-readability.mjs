import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseCatalog, effectiveSource, sourceSignature, matchCatalogTranslation, protectedTokens} from './translation-audit.mjs';
import {catalogPath} from './apply-context-review.mjs';

// Screening, not a game-layout or audio-sync simulator. The film-subtitle
// reference rate is advisory; no text is truncated, reflowed or written.
export const readabilityPolicy = Object.freeze({
 referenceCharactersPerSecond: 17, longTextCharacters: 300,
 expansionRatio: 1.6, expansionMinimumCharacters: 150,
 source: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215600497-Portuguese-Brazil-Timed-Text-Style-Guide',
 applicability: 'Reading-workload reference only, not a Gates of Hell display limit.'
});

export function visibleTemplate(text) {
 const formatting = protectedTokens(text).filter(token => token.startsWith('<') && !/^<[xy]\(\)>$/.test(token));
 let result = text;
 for (const token of formatting) result = result.replaceAll(token, '');
 // Position offsets are normalized by protectedTokens; remove the original
 // numeric form separately. Substitution variables remain visible as templates.
 return result.replace(/<[xy]\(-?\d+(?:\.\d+)?\)>/g, '').replace(/\r\n/g, '\n');
}
const count = text => [...text.normalize('NFC')].length;
export function isSubtitleCandidate(file, context) {
 return /^interface\/text\/mission\/single\//.test(file) &&
  /\/(?:\[?narrators?\]?|speech|dialog(?:ue)?|radio)(?:\/|_|$)/i.test(context);
}

export function analyzeReadability(source, translation, options = {}) {
 const rate = options.referenceCharactersPerSecond ?? readabilityPolicy.referenceCharactersPerSecond;
 if (!Number.isFinite(rate) || rate <= 0) throw new Error('Positive advisory reading rate required');
 const en = visibleTemplate(source), pt = visibleTemplate(translation);
 const sourceCharacters = count(en), translationCharacters = count(pt);
 const variableSubstitutions = protectedTokens(translation).filter(t => !t.startsWith('<'));
 const ratio = sourceCharacters ? translationCharacters / sourceCharacters : null;
 const advisory = [], issues = [];
 if (translationCharacters >= readabilityPolicy.longTextCharacters) advisory.push('long-dialogue-template');
 if (translationCharacters >= readabilityPolicy.expansionMinimumCharacters && ratio >= readabilityPolicy.expansionRatio) advisory.push('high-source-to-target-expansion');
 const explicitLines = pt.split('\n');
 if (explicitLines.length > 2) advisory.push('multiple-explicit-lines');
 if (variableSubstitutions.length) advisory.push('rendered-variable-length-unknown');
 if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(pt)) issues.push('non-display-control-character');
 const duration = options.confirmedDisplaySeconds ?? null;
 if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) throw new Error('Confirmed display duration must be positive');
 if (duration !== null && !variableSubstitutions.length && translationCharacters / duration > rate) advisory.push('reading-rate-above-reference');
 return {sourceCharacters, translationCharacters, expansionRatio: ratio === null ? null : Number(ratio.toFixed(3)),
  explicitLines: explicitLines.length, longestExplicitLineCharacters: Math.max(...explicitLines.map(count)),
  readingSecondsAtReferenceRate: Number((translationCharacters / rate).toFixed(2)),
  confirmedDisplaySeconds: duration, templateCharactersPerConfirmedSecond: duration === null || variableSubstitutions.length ? null : Number((translationCharacters / duration).toFixed(2)),
  variableSubstitutions, advisory, issues, screenFitVerified: false, audioSyncVerified: false};
}

export function checkReadabilityRoot(repo, {nativeDialogueContexts = []} = {}) {
 const base = path.resolve(repo), enRoot = path.join(base, 'localization/en'), ptRoot = path.join(base, 'localization/pt_BR');
 const nativeKeys = new Map();
 for (const c of nativeDialogueContexts) {
  if (typeof c.file !== 'string' || typeof c.context !== 'string' || !c.context ||
      (c.sourceHash != null && !/^[a-f0-9]{64}$/.test(c.sourceHash))) throw new Error('Invalid native dialogue binding');
  catalogPath(enRoot, c.file);
  const key = JSON.stringify([c.file, c.context]);
  if (!nativeKeys.has(key)) nativeKeys.set(key, new Set());
  nativeKeys.get(key).add(c.sourceHash ?? null);
 }
 const records = [], issues = [], files = [], counts = {};
 const encounteredContexts = new Set(), resolvedNativeBindings = new Set();
 let missionCatalogs = 0, logicalMissionAssociations = 0;
 const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
 const normalizePath = value => process.platform === 'win32' ? value.toLowerCase() : value;
 function assertContained(root, target) {
  let component = base;
  for (const part of path.relative(base, target).split(path.sep)) {
   component = path.join(component, part);
   if (fs.lstatSync(component).isSymbolicLink()) throw new Error('Catalog ancestor symlink is not allowed');
  }
  if (!normalizePath(fs.realpathSync(target)).startsWith(normalizePath(fs.realpathSync(root) + path.sep)))
   throw new Error('Catalog leaves locale root');
 }
 function walk(folder, relative = '') {
  for (const item of fs.readdirSync(folder, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
   if (item.isSymbolicLink()) throw new Error('Catalog symlink is not allowed');
   if (item.isDirectory()) walk(path.join(folder, item.name), relative + item.name + '/');
   else if (item.name.endsWith('.pot')) files.push(relative + item.name);
  }
 }
 walk(enRoot);
 if (!files.length) throw new Error('Empty source catalog inventory');
 for (const file of files) {
  const sourceFile = catalogPath(enRoot, file), targetFile = catalogPath(ptRoot, file);
  assertContained(enRoot, sourceFile); assertContained(ptRoot, targetFile);
  const en = parseCatalog(decoder.decode(fs.readFileSync(sourceFile)), file, {tolerant: true}).filter(e => !e.header);
  const pt = parseCatalog(decoder.decode(fs.readFileSync(targetFile)), file, {tolerant: true}).filter(e => !e.header);
  const mission = /^interface\/text\/mission\/single\//.test(file);
  if (mission) missionCatalogs++;
  const seen = new Set();
  for (const entry of en) {
   const source = effectiveSource(entry), key = JSON.stringify([entry.msgctxt, sourceSignature(entry), source]);
   if (seen.has(key)) continue; seen.add(key);
   if (mission) logicalMissionAssociations++;
   const nativeSources = nativeKeys.get(JSON.stringify([file, entry.msgctxt]));
   const contextKey = JSON.stringify([file, entry.msgctxt]);
   encounteredContexts.add(contextKey);
   const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
   const native = nativeSources?.has(sourceHash) ?? false;
   const suppliedCandidate = nativeSources?.has(null) ?? false;
   if (native) resolvedNativeBindings.add(JSON.stringify([contextKey, sourceHash]));
   if (suppliedCandidate) resolvedNativeBindings.add(JSON.stringify([contextKey, null]));
   if (!native && !suppliedCandidate && !isSubtitleCandidate(file, entry.msgctxt)) continue;
   const association = matchCatalogTranslation(en, pt, entry.msgctxt, source);
   if (association.matches.length !== 1) {issues.push({file, context: entry.msgctxt, type: 'readability-association'}); continue;}
   const target = association.matches[0];
   if (entry.msgid_plural !== undefined || Object.keys(target.translations).some(k => k !== 'msgstr')) throw new Error('Subtitle plural forms require explicit review');
   const translation = target.translations.msgstr || '', metrics = analyzeReadability(source, translation);
   for (const flag of metrics.advisory) counts[flag] = (counts[flag] || 0) + 1;
   issues.push(...metrics.issues.map(type => ({file, context: entry.msgctxt, type})));
   records.push({file, context: entry.msgctxt, source, translation,
    selection: native ? 'native-indexed-dialogue-context' : suppliedCandidate ? 'supplied-dialogue-context-candidate' : 'source-context-dialogue-candidate', ...metrics});
  }
 }
 for (const [key, hashes] of nativeKeys) {
  const [file, context] = JSON.parse(key);
  if (!encounteredContexts.has(key)) issues.push({file, context,
   type: files.includes(file) ? 'native-dialogue-context-missing' : 'native-dialogue-catalog-missing'});
  else for (const sourceHash of hashes) if (!resolvedNativeBindings.has(JSON.stringify([key, sourceHash])))
   issues.push({file, context, sourceHash, type: 'native-dialogue-source-drift'});
 }
 return {catalogs: files.length, missionCatalogs, logicalMissionAssociations, selectedDialogueAssociations: records.length,
  uniqueDialogueSources: new Set(records.map(r => r.source)).size, referencePolicy: readabilityPolicy,
  nativeCallerSelection: nativeKeys.size, advisoryCounts: counts, issues, records,
  limitations: ['Candidates selected by context or verified native dialogue caller, not every message is proven a timed subtitle.',
   'Explicit line length is not rendered width; engine wrapping, font fallback, resolution and scale are not simulated.',
   'Reference reading seconds are a screening estimate, never audio length or actual display duration.',
   'Variables retain template notation; their rendered length is unknown.',
   'No truncation or automatic hard line breaks are applied.']};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const flag = process.argv.slice(2).join(' ');
 if (!['--check', '--report'].includes(flag)) throw new Error('Use: node tools/subtitle-readability.mjs --check|--report');
 const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
 const ledgerFile = path.join(repo, 'translation/mission-context-review-2026-10-13.json');
 const nativeDialogueContexts = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')).catalogs.flatMap(f =>
  (f.callers ?? []).filter(c => /^(?:talk|say|speech|subtitle)$/i.test(c.command ?? '')).map(c => ({file: f.file, context: c.context, sourceHash: c.sourceHash}))) : [];
 const result = checkReadabilityRoot(repo, {nativeDialogueContexts});
 console.log(JSON.stringify(flag === '--report' ? result : {...result, records: undefined}, null, 2));
 if (result.issues.length) process.exitCode = 1;
}
