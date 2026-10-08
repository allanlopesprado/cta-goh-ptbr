import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const SHA = /^[0-9a-f]{64}$/;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function checkSourceIntegrity(repo, snapshot, manifest) {
  if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.files) || !snapshot.files.length) throw new Error('Expected nonempty source file snapshot');
  if (!SHA.test(snapshot.sourcePackageSha256 || '') || snapshot.sourcePackageSha256 !== manifest?.package?.sha256?.toLowerCase() || snapshot.referenceDate !== manifest?.referenceDate) throw new Error('Source snapshot differs from package provenance');
  const expected = new Map();
  const caseNames = new Set();
  for (const entry of snapshot.files) {
    if (typeof entry.file !== 'string' || /[\\:\x00-\x1f\x7f]/.test(entry.file) || entry.file.split('/').some(x => !x || x === '.' || x === '..' || /[. ]$/.test(x)) || (!entry.file.endsWith('.pot') && entry.file !== 'localization.info')) throw new Error('Unsafe source file path');
    if (!SHA.test(entry.sha256 || '') || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0) throw new Error('Invalid source file fingerprint');
    if (caseNames.has(entry.file.toLowerCase())) throw new Error('Duplicate source snapshot path');
    caseNames.add(entry.file.toLowerCase());
    expected.set(entry.file, entry);
  }
  const repoRoot = fs.realpathSync(repo);
  for (const folder of ['localization', 'localization/en']) {
    const stat = fs.lstatSync(path.join(repoRoot, folder));
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Source directory must be regular: ' + folder);
  }
  const root = path.join(repoRoot, 'localization/en');
  const issues = [];
  const seen = new Set();
  function walk(folder) {
    for (const item of fs.readdirSync(folder, {withFileTypes: true})) {
      const file = path.join(folder, item.name);
      if (item.isSymbolicLink()) throw new Error('Symlink in English source');
      if (item.isDirectory()) { walk(file); continue; }
      if (!item.isFile()) throw new Error('Non-regular English source');
      const relative = path.relative(root, file).split(path.sep).join('/');
      seen.add(relative);
      const entry = expected.get(relative);
      if (!entry) { issues.push({type: 'unexpected-source-file', file: relative}); continue; }
      const bytes = fs.readFileSync(file);
      new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      const actual = hash(bytes);
      if (actual !== entry.sha256 || bytes.length !== entry.bytes) issues.push({type: 'source-byte-change', file: relative, expectedSha256: entry.sha256, actualSha256: actual, expectedBytes: entry.bytes, actualBytes: bytes.length});
    }
  }
  walk(root);
  for (const file of expected.keys()) if (!seen.has(file)) issues.push({type: 'missing-source-file', file});
  const expectedCatalogs = snapshot.files.filter(e => e.file.endsWith('.pot')).length;
  if (snapshot.files.length !== manifest.package.entries || expectedCatalogs !== manifest.package.potFiles) throw new Error('Source snapshot inventory differs from provenance');
  return {files: seen.size, catalogs: expectedCatalogs, sourcePackageSha256: snapshot.sourcePackageSha256, issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') !== '--check') throw new Error('Use: node tools/source-integrity.mjs --check');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const read = file => JSON.parse(fs.readFileSync(path.join(repo, 'translation', file), 'utf8'));
  const result = checkSourceIntegrity(repo, read('source-files.json'), read('source-manifest.json'));
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length) process.exitCode = 1;
}
