import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog, effectiveSource, sourceSignature, matchCatalogTranslation} from './translation-audit.mjs';
import {catalogPath} from './apply-context-review.mjs';

// Narrow source-driven safeguards, not a translator or a semantic certificate.
// They allow alternative PT wording but protect specific audited distinctions.
export function checkSemanticFeatures({file, context, source, translation}) {
 const issues = [], features = [];
 const fail = (type, detail) => issues.push({file, context, type, detail});
 if (/\bAT Rifleman\b/.test(source)) {
  features.push('anti-tank-rifle-role');
  if (!/\bfuzil\s+(?:anti[- ]?tanque|anti[- ]?carro|AT)\b/iu.test(translation))
   fail('anti-tank-rifle-role', 'Preservar a função com fuzil antitanque, não apenas atirador AT.');
 }
 if (file === 'interface/text/dlg_frontend.pot' && /^options\/keys\/keymap\/key_(?:home|delete|back)$/.test(context) && /^(?:HOME|DELETE|BACK)$/.test(source)) {
  features.push('physical-key-name');
  if (translation.trim().toUpperCase() !== source)
   fail('physical-key-name', 'Preservar o nome da tecla física; não confundir com uma ação do menu.');
 }
 if (file === 'interface/text/dlg_ingame.pot' && /^actionbar\/pour_(?:in|out)$/.test(context) && /^Pour (?:In|Out)$/.test(source)) {
  features.push('fuel-transfer-domain');
  if (!translation.trim() || /\b(?:embarcar|desembarcar|embarque|desembarque)\b/iu.test(translation))
   fail('fuel-transfer-domain', 'Não usar rótulos de embarque/desembarque na ação de líquido. Esta regra não certifica outros verbos nem a direção do recipiente.');
 }
 const itemDescription = /^interface\/text\/desc\//.test(file) || /^mission\/single\/0x-skirmish\/menu_eng\//.test(context) || context === 'mission/single/05-eng/1944_07_18_caen_goodwood/doctrine_offensive';
 if (itemDescription) {
  const nominal = value => {
   const [integer = '', fraction = ''] = value.replace(',', '.').split('.');
   const whole = (integer || '0').replace(/^0+(?=\d)/, '');
   const decimals = fraction.replace(/0+$/, '');
   return whole + (decimals ? '.' + decimals : '');
  };
  const targets = [...translation.matchAll(/(?<![\d.,])(\d+(?:[.,]\d+)?|[.,]\d+)\s+(?:pol\.(?!\w)|polegadas?\b)/giu)].map(m => nominal(m[1]));
  for (const match of source.matchAll(/(?<![\d.])(\d+(?:\.\d+)?|\.\d+)[ -]?inch(?:es)?\b/gi)) {
   features.push('nominal-inch-calibre');
   const at = targets.indexOf(nominal(match[1]));
   if (at === -1)
    fail('nominal-inch-calibre', 'Preservar o calibre nominal ' + match[1] + ' em pol. ou polegadas, sem conversão.');
   else targets.splice(at, 1);
  }
  if (features.includes('nominal-inch-calibre') && /(?:\binch|\dinch)(?:es)?\b/i.test(translation))
   fail('untranslated-inch-unit', 'A unidade descritiva inch deve ser localizada; códigos de modelo permanecem intactos.');
 }
 return {features, issues};
}

export function checkCatalogSemanticFeatures(englishText, portugueseText, file) {
 const en = parseCatalog(englishText, file, {tolerant: true}).filter(e => !e.header);
 const pt = parseCatalog(portugueseText, file, {tolerant: true}).filter(e => !e.header);
 const seen = new Set(), issues = [], counts = {};
 let logicalEntries = 0, protectedEntries = 0;
 for (const entry of en) {
  const source = effectiveSource(entry), identity = JSON.stringify([entry.msgctxt, sourceSignature(entry), source]);
  if (seen.has(identity)) continue;
  seen.add(identity); logicalEntries++;
  const selection = checkSemanticFeatures({file, context: entry.msgctxt, source, translation: ''});
  if (!selection.features.length) continue;
  protectedEntries++;
  for (const feature of selection.features) counts[feature] = (counts[feature] || 0) + 1;
  const association = matchCatalogTranslation(en, pt, entry.msgctxt, source);
  if (association.matches.length !== 1) {
   issues.push({file, context: entry.msgctxt, type: 'semantic-feature-association', detail: 'Fonte protegida sem tradução única correspondente.'});
   continue;
  }
  const target = association.matches[0];
  if (target.msgid_plural !== undefined || Object.keys(target.translations).some(k => k !== 'msgstr'))
   throw new Error('Semantic feature plural forms require explicit review: ' + file + ': ' + entry.msgctxt);
  issues.push(...checkSemanticFeatures({file, context: entry.msgctxt, source, translation: target.translations.msgstr || ''}).issues);
 }
 return {logicalEntries, protectedEntries, counts, issues};
}

export function checkSemanticRoot(repo) {
 const englishRoot = path.resolve(repo, 'localization/en'), targetRoot = path.resolve(repo, 'localization/pt_BR');
 const files = [], normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
 function walk(folder, relative = '') {
  for (const item of fs.readdirSync(folder, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
   if (item.isSymbolicLink()) throw new Error('Catalog symlink is not allowed: ' + path.join(folder, item.name));
   if (item.isDirectory()) walk(path.join(folder, item.name), relative + item.name + '/');
   else if (item.name.endsWith('.pot')) {
    if (!item.isFile()) throw new Error('Non-regular catalog: ' + item.name);
    files.push(relative + item.name);
   }
  }
 }
 walk(englishRoot);
 if (!files.length) throw new Error('Empty source catalog inventory');
 const issues = [], counts = {};
 let logicalEntries = 0, protectedEntries = 0;
 const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
 for (const file of files) {
  const target = catalogPath(targetRoot, file);
  if (!normalize(fs.realpathSync(target)).startsWith(normalize(fs.realpathSync(targetRoot) + path.sep)))
   throw new Error('Catalog symlink leaves locale root: ' + file);
  const result = checkCatalogSemanticFeatures(decoder.decode(fs.readFileSync(path.join(englishRoot, file))), decoder.decode(fs.readFileSync(target)), file);
  logicalEntries += result.logicalEntries; protectedEntries += result.protectedEntries;
  for (const [feature, count] of Object.entries(result.counts)) counts[feature] = (counts[feature] || 0) + count;
  issues.push(...result.issues);
 }
 return {catalogs: files.length, logicalEntries, protectedEntries, counts, issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 if (process.argv.slice(2).join(' ') !== '--check') throw new Error('Use: node tools/semantic-features.mjs --check');
 const result = checkSemanticRoot(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
 console.log(JSON.stringify(result, null, 2));
 if (result.issues.length) process.exitCode = 1;
}
