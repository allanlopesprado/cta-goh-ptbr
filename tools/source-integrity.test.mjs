import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkSourceIntegrity} from './source-integrity.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(run) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-source-integrity-'));
  try {
    const root = path.join(repo, 'localization/en');
    fs.mkdirSync(root, {recursive: true});
    const source = Buffer.from('\uFEFFmsgctxt "x"\r\nmsgid "Tank"\r\nmsgstr ""\r\n');
    fs.writeFileSync(path.join(root, 'test.pot'), source);
    fs.writeFileSync(path.join(root, 'localization.info'), 'English');
    const files = ['test.pot', 'localization.info'].map(file => {
      const bytes = fs.readFileSync(path.join(root, file));
      return {file, bytes: bytes.length, sha256: sha(bytes)};
    });
    const snapshot = {schemaVersion: 1, referenceDate: '2026-10-07', sourcePackageSha256: 'a'.repeat(64), files};
    const manifest = {referenceDate: snapshot.referenceDate, package: {sha256: snapshot.sourcePackageSha256.toUpperCase(), entries: 2, potFiles: 1}};
    run({repo, root, source, snapshot, manifest});
  } finally {
    assert.ok(path.resolve(repo).startsWith(path.join(os.tmpdir(), 'cta-source-integrity-')));
    fs.rmSync(repo, {recursive: true});
  }
}

test('English byte snapshot preserves BOM and CRLF and checks without writes', () => fixture(({repo, root, source, snapshot, manifest}) => {
  const result = checkSourceIntegrity(repo, snapshot, manifest);
  assert.deepEqual(result.issues, []);
  assert.equal(result.files, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'test.pot')), source);
}));

test('source byte, EOL and BOM changes are detected even if message meaning is unchanged', () => fixture(({repo, root, source, snapshot, manifest}) => {
  fs.writeFileSync(path.join(root, 'test.pot'), source.toString('utf8').replace(/^\uFEFF/, '').replaceAll('\r\n', '\n'));
  assert.ok(checkSourceIntegrity(repo, snapshot, manifest).issues.some(e => e.type === 'source-byte-change'));
}));

test('source additions and deletions cannot pass the recorded inventory', () => fixture(({repo, root, snapshot, manifest}) => {
  fs.unlinkSync(path.join(root, 'test.pot'));
  fs.writeFileSync(path.join(root, 'extra.pot'), 'New');
  const result = checkSourceIntegrity(repo, snapshot, manifest);
  assert.ok(result.issues.some(e => e.type === 'unexpected-source-file'));
  assert.ok(result.issues.some(e => e.type === 'missing-source-file'));
}));

test('snapshot identity and inventory must match source provenance', () => fixture(({repo, snapshot, manifest}) => {
  assert.throws(() => checkSourceIntegrity(repo, {...snapshot, sourcePackageSha256: 'b'.repeat(64)}, manifest), /provenance/);
  assert.throws(() => checkSourceIntegrity(repo, {...snapshot, referenceDate: '2026-10-08'}, manifest), /provenance/);
  assert.throws(() => checkSourceIntegrity(repo, snapshot, {...manifest, package: {...manifest.package, potFiles: 2}}), /inventory/);
}));

test('unsafe, duplicate and malformed fingerprints are rejected', () => fixture(({repo, snapshot, manifest}) => {
  for (const file of ['../test.pot', '/test.pot', 'C:/test.pot', 'a\\test.pot', 'a/../test.pot', 'test.pot/']) {
    assert.throws(() => checkSourceIntegrity(repo, {...snapshot, files: [{...snapshot.files[0], file}]}, manifest), /Unsafe/);
  }
  assert.throws(() => checkSourceIntegrity(repo, {...snapshot, files: [snapshot.files[0], {...snapshot.files[0], file: 'TEST.POT'}]}, manifest), /Duplicate|Unsafe/);
  assert.throws(() => checkSourceIntegrity(repo, {...snapshot, files: [{...snapshot.files[0], sha256: 'invalid'}]}, manifest), /fingerprint/);
  assert.throws(() => checkSourceIntegrity(repo, {...snapshot, files: []}, manifest), /nonempty/);
}));

test('invalid UTF-8 is rejected before treating changed bytes as ordinary source text', () => fixture(({repo, root, snapshot, manifest}) => {
  fs.writeFileSync(path.join(root, 'test.pot'), Buffer.from([0xff]));
  assert.throws(() => checkSourceIntegrity(repo, snapshot, manifest), /encoded data|encoding|UTF/i);
}));

test('a symlink inside English or its ancestor cannot bypass the inventory', () => fixture(({repo, root, snapshot, manifest}) => {
  const external = path.join(repo, 'external');
  fs.mkdirSync(external);
  fs.symlinkSync(external, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => checkSourceIntegrity(repo, snapshot, manifest), /Symlink/);
  fs.unlinkSync(path.join(root, 'linked'));
  fs.renameSync(root, external + '-english');
  fs.symlinkSync(external + '-english', root, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => checkSourceIntegrity(repo, snapshot, manifest), /regular/);
}));
