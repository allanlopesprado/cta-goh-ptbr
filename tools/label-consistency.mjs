import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog, effectiveSource, sourceSignature, matchCatalogTranslation} from './translation-audit.mjs';
import {catalogPath} from './apply-context-review.mjs';

// Source-selected editorial conventions for short labels, not a semantic or
// grammatical certificate. Dialogue, prose, model codes and untranslated proper
// names are not globally rewritten. The core auditor remains the syntax gate.
const rules = [
 ['scope', /^(?:Scope|Scoped)$/i, ['Mira Telescópica']],
 ['early', /^Early$/i, ['Inicial']],
 ['mid', /^Mid$/i, ['Intermediário', 'Intermediária']],
 ['late', /^Late$/i, ['Tardio', 'Tardia']],
 ['towed', /^(?:towed|tow)$/i, ['Rebocado', 'Rebocada']],
 ['flame', /^Flame$/i, ['Lança-chamas']],
 ['mounted', /^Mounted$/i, ['Embarcada', 'Embarcado']],
 ['dismounted', /^Dismounted$/i, ['Apeada', 'Apeado']],
 ['m8-carriage', /^M8\s*Carriage$/i, ['Reparo M8']],
 ['supply', /^(?:Supply|Supplies)$/i, ['Suprimentos']],
 ['vehicle-engineer', /^Engineer$/i, ['Engenharia']],
 ['belt', /^Belt$/i, ['Fita']],
 ['drum', /^Drum$/i, ['Tambor']],
 ['double-drum', /^Double\s*drum$/i, ['Tambor Duplo']],
 ['ammo-double', /^double$/i, ['Duplo']]
];
const unmark = text => text.replace(/<[^<>]*>/g, '');
function roleParts(file, context, source) {
 if (!/^interface\/text\/desc\//.test(file)) return [];
 const roles = [];
 if (/^desc\/(?:human\/|squad\/single_)/.test(context)) {
  // Longest role first: an assistant is not certified by the crew label alone.
  for (const match of source.matchAll(/\bMG Crew Asst\.?(?!\w)|\bMG Crew\b(?! Asst)|\bMG Asst\.?(?!\w)|\bMG Operator\b|\bFlak Crew\b|\bWeapon Crew\b/gi)) {
   const value = match[0].replace(/\.$/, '').toLowerCase();
   const [family, expected] = {
    'mg crew asst': ['mg-crew-assistant', 'Auxiliar da Guarnição de MG'],
    'mg crew': ['mg-crew', 'Guarnição de MG'],
    'mg asst': ['mg-assistant', 'Auxiliar de MG'],
    'mg operator': ['mg-operator', 'Operador de MG'],
    'flak crew': ['flak-crew', 'Guarnição Flak'],
    'weapon crew': ['weapon-crew', 'Guarnição de Arma']
   }[value];
   const alternatives = [expected];
   // Explicit Motor / Motor Scout modifiers may legitimately sit inside the PT
   // role phrase. This does not license invented modifiers in an ordinary role.
   if (/\bMotor(?: Scout)?\s+$/i.test(source.slice(0, match.index))) {
    if (family === 'mg-operator') alternatives.push('Operador Motorizado de MG');
    if (family === 'mg-assistant') alternatives.push('Auxiliar Motorizado de MG');
   }
   roles.push({family, sourcePart: match[0], expected: alternatives});
  }
  if (!/\b(?:Squad|Section|Team|Unit|Sapper)\b/i.test(source))
   for (const match of source.matchAll(/\bRifleman\b/gi)) roles.push({family: 'rifleman', sourcePart: match[0], expected: ['Atirador']});
 }
 if (/^desc\/squad\//.test(context))
  for (const match of source.matchAll(/\bRoyal Engineers Field Section\b/gi))
   roles.push({family: 'royal-engineers-field-section', sourcePart: match[0], expected: ['Seção de Campo dos Engenheiros Reais']});
 return roles;
}
function parentheses(text) {
 // Only flat parentheses: embedded model tokens such as SmK(H) and 38(t) are
 // extracted but cannot match any whole-qualifier alias. Nested text is ignored.
 const values = [];
 let start = -1, depth = 0, nested = false;
 for (let i = 0; i < text.length; i++) {
  if (text[i] === '(') {
   if (!depth) {start = i; nested = false;} else nested = true;
   depth++;
  } else if (text[i] === ')' && depth && --depth === 0 && !nested) values.push({value: text.slice(start + 1, i), start});
 }
 return values;
}
function labelContext(file, context, source) {
 if (source.length > 200 || /[\r\n]/.test(source)) return false;
 if (/^interface\/text\/desc\//.test(file)) return /^desc\//.test(context);
 if (file === 'interface/text/mission/single/05-eng/1940_05_13_dyle.pot' &&
     context === 'mission/single/05-eng/1940_05_13_dyle/doctrine_allround') return true;
 return /^interface\/text\/mission\/single\//.test(file) && /^mission\/single\//.test(context)
  && /\/(?:menu_[^/]+|reinf(?:orcements?)?)(?:\/|_)/.test(context)
  && !/\/(?:dialog(?:ue)?|info|hints?)(?:\/|_|$)/.test(context);
}

export function checkLabelConsistency({file, context, source, translation}) {
 const issues = [], families = [], cleanSource = unmark(source);
 if (!labelContext(file, context, cleanSource)) return {families, issues};
 const cleanTarget = unmark(translation), targets = parentheses(cleanTarget);
 for (const {value: qualifier} of parentheses(cleanSource)) {
  const rule = rules.find(([, alias]) => alias.test(qualifier.trim()));
  if (!rule) continue;
  const [family, , expected] = rule;
  if (family === 'vehicle-engineer' && (/^desc\/human\//.test(context) || !/\b(?:Bedford|GMC|Ford|Opel|ZIS|GAZ|Sd\.Kfz)\b/i.test(cleanSource))) continue;
  if (family === 'ammo-double' && !/^interface\/text\/desc\/desc_ammo[^/]*\.pot$/.test(file)) continue;
  families.push(family);
  const index = targets.findIndex(({value}) => expected.includes(value.trim()));
  if (index >= 0) {
   const [target] = targets.splice(index, 1); // One target cannot satisfy two occurrences.
   if (target.value !== target.value.trim() || (target.start > 0 &&
    (cleanTarget[target.start - 1] !== ' ' || (target.start > 1 && /\s/.test(cleanTarget[target.start - 2])))))
    issues.push({file, context, field: 'msgstr', type: 'label-qualifier-format', family, sourceQualifier: qualifier,
     expected: expected.map(value => '(' + value + ')'), detail: 'Usar exatamente um espaço ASCII antes do qualificador quando houver texto precedente, sem espaços internos nos parênteses.'});
  }
  else issues.push({file, context, field: 'msgstr', type: 'label-qualifier', family,
   sourceQualifier: qualifier, expected: expected.map(value => '(' + value + ')'),
   detail: 'Padronizar o qualificador do rótulo; esta regra não certifica o gênero gramatical nem o restante da tradução.'});
 }
 // In short labels, use the agreed abbreviation rather than the prose form.
 // Numeric equivalence and nominal calibre preservation belong to the separate
 // semantic-feature gate; this gate only protects notation and multiplicity.
 let abbreviatedUnits = [...cleanTarget.matchAll(/\bpol\.(?!\w)/g)].length;
 // The attached alias 4.5in/8in is a nominal unit in these short labels.
 // Do not treat a preposition (1912 in Britain) or the whole retained vehicle
 // designation 3-in SP Mk.I as an untranslated descriptive unit.
 const inchSources = [...cleanSource.matchAll(/(?<![\d.])(\d+(?:\.\d+)?|\.\d+)(?:[ -]?inch(?:es)?|in)\b/gi)];
 for (const match of inchSources) {
  families.push('inch-label-unit');
  if (abbreviatedUnits) abbreviatedUnits--;
  else issues.push({file, context, field: 'msgstr', type: 'label-inch-unit', family: 'inch-label-unit',
   sourcePart: match[0], expected: ['pol.'], detail: 'Usar pol. no rótulo curto, preservando separadamente o calibre nominal pelo validador semântico.'});
 }
 if (inchSources.length && /\bpolegadas?\b/i.test(cleanTarget) && !issues.some(issue => issue.type === 'label-inch-unit'))
  issues.push({file, context, field: 'msgstr', type: 'label-inch-unit', family: 'inch-label-unit', expected: ['pol.'],
   detail: 'Reservar a forma por extenso para prosa; neste rótulo curto, usar pol.'});
 // Components of role names follow the agreed label style, not a claim that
 // alternate terms are inherently mistranslations. Consume each occurrence.
 let targetRoles = unmark(translation);
 for (const {family, sourcePart, expected} of roleParts(file, context, cleanSource)) {
  families.push(family);
  const escaped = expected.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp('\\b(?:' + escaped + ')\\b');
  const match = pattern.exec(targetRoles);
  if (match) targetRoles = targetRoles.slice(0, match.index) + '\0'.repeat(match[0].length) + targetRoles.slice(match.index + match[0].length);
  else issues.push({file, context, field: 'msgstr', type: 'label-role-part', family, sourcePart, expected,
   detail: 'Padronizar o componente do cargo conforme a convenção editorial acordada; não é uma certificação semântica da tradução completa.'});
 }
 return {families, issues};
}

export function checkCatalogLabelConsistency(englishText, portugueseText, file) {
 const en = parseCatalog(englishText, file, {tolerant: true}).filter(e => !e.header);
 const pt = parseCatalog(portugueseText, file, {tolerant: true}).filter(e => !e.header);
 const seen = new Set(), issues = [], counts = {};
 let logicalEntries = 0, protectedEntries = 0;
 for (const entry of en) {
  const source = effectiveSource(entry), identity = JSON.stringify([entry.msgctxt, sourceSignature(entry), source]);
  if (seen.has(identity)) continue;
  seen.add(identity); logicalEntries++;
  const selection = checkLabelConsistency({file, context: entry.msgctxt, source, translation: ''});
  if (!selection.families.length) continue;
  protectedEntries++;
  for (const family of selection.families) counts[family] = (counts[family] || 0) + 1;
  const association = matchCatalogTranslation(en, pt, entry.msgctxt, source);
  if (association.matches.length !== 1) {
   issues.push({file, context: entry.msgctxt, field: 'msgstr', type: 'label-association',
    families: selection.families, detail: 'Fonte protegida sem tradução única correspondente.'});
   continue;
  }
  const target = association.matches[0];
  if (entry.msgid_plural !== undefined || target.msgid_plural !== undefined || Object.keys(target.translations).some(k => k !== 'msgstr'))
   throw new Error('Label qualifier plural forms require explicit review: ' + file + ': ' + entry.msgctxt);
  issues.push(...checkLabelConsistency({file, context: entry.msgctxt, source, translation: target.translations.msgstr || ''}).issues);
 }
 return {logicalEntries, protectedEntries, counts, issues};
}

export function checkLabelRoot(repo) {
 const base = path.resolve(repo), roots = ['en', 'pt_BR'].map(locale => path.join(base, 'localization', locale));
 // Check locale ancestors, not merely each file's last component. Junctions or
 // symlinks must not redirect the source or target locale outside the repository.
 for (const root of roots) {
  let component = base;
  for (const part of path.relative(base, root).split(path.sep)) {
   component = path.join(component, part);
   if (fs.lstatSync(component).isSymbolicLink()) throw new Error('Catalog ancestor symlink is not allowed: ' + component);
  }
 }
 const files = [];
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
 walk(roots[0]);
 if (!files.length) throw new Error('Empty source catalog inventory');
 const issues = [], counts = {}, decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
 const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
 let logicalEntries = 0, protectedEntries = 0;
 for (const file of files) {
  const paths = roots.map(root => catalogPath(root, file));
  for (let i = 0; i < paths.length; i++) {
   let component = roots[i];
   for (const part of file.split('/')) {
    component = path.join(component, part);
    if (fs.lstatSync(component).isSymbolicLink()) throw new Error('Catalog symlink is not allowed: ' + component);
   }
   if (!normalize(fs.realpathSync(paths[i])).startsWith(normalize(fs.realpathSync(roots[i]) + path.sep)))
    throw new Error('Catalog symlink leaves locale root: ' + file);
   if (!fs.lstatSync(paths[i]).isFile()) throw new Error('Non-regular catalog: ' + file);
  }
  const result = checkCatalogLabelConsistency(...paths.map(filename => decoder.decode(fs.readFileSync(filename))), file);
  logicalEntries += result.logicalEntries; protectedEntries += result.protectedEntries;
  for (const [family, count] of Object.entries(result.counts)) counts[family] = (counts[family] || 0) + count;
  issues.push(...result.issues);
 }
 return {catalogs: files.length, logicalEntries, protectedEntries, counts, issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 if (process.argv.slice(2).join(' ') !== '--check') throw new Error('Use: node tools/label-consistency.mjs --check');
 const result = checkLabelRoot(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
 console.log(JSON.stringify(result, null, 2));
 if (result.issues.length) process.exitCode = 1;
}
