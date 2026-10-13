import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog} from './translation-audit.mjs';

// This project prefers plain punctuation to U+2014 in player-visible PT text.
// English originals, metadata headers and historical review evidence are untouched.
export function checkTranslationStyle(text, filename = '<catalog>') {
 const issues = [];
 for (const entry of parseCatalog(text, filename, {tolerant: true})) {
  if (entry.header) continue;
  for (const [field, value] of Object.entries(entry.translations)) {
   const count = value.split('\u2014').length - 1;
   if (count) issues.push({file: filename, context: entry.msgctxt, line: entry.line, field, type: 'em-dash-in-translation', count});
  }
 }
 return issues;
}

export function checkStyleRoot(root) {
 const issues = [];
 let catalogs = 0;
 function walk(folder) {
  for (const item of fs.readdirSync(folder, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
   const file = path.join(folder, item.name);
   if (item.isSymbolicLink()) throw new Error('Catalog symlink is not allowed: ' + file);
   if (item.isDirectory()) { walk(file); continue; }
   if (!item.name.endsWith('.pot')) continue;
   if (!item.isFile()) throw new Error('Non-regular catalog: ' + file);
   const relative = path.relative(root, file).split(path.sep).join('/');
   const text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(fs.readFileSync(file));
   catalogs++;
   issues.push(...checkTranslationStyle(text, relative));
  }
 }
 walk(root);
 if (!catalogs) throw new Error('Empty translated catalog inventory');
 return {catalogs, issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 if (process.argv.slice(2).join(' ') !== '--check') throw new Error('Use: node tools/translation-style.mjs --check');
 const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
 const result = checkStyleRoot(path.join(repo, 'localization/pt_BR'));
 console.log(JSON.stringify(result, null, 2));
 if (result.issues.length) process.exitCode = 1;
}
