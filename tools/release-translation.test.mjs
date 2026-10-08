import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateReleaseMetadata, validateTrigger, extractReleaseNotes, validatePackageBytes} from './release-translation.mjs';

const bytes = Buffer.from('fixture package');
const metadata = {
  schemaVersion: 1, tag: 'v1.0.20', title: 'v1.0.20 — revisão',
  gameTested: false, gameVersion: null, sourceReferenceDate: '2026-10-07',
  sourceManifest: 'translation/source-manifest.json', changelog: 'CHANGELOG.md',
  sourcePackageSha256: 'b'.repeat(64), pakSha256: createHash('sha256').update(bytes).digest('hex'),
  pakBytes: bytes.length, pakFiles: 363,
};
const body = `Validação técnica de catálogos e integridade do pacote.\n${metadata.pakSha256}\n${metadata.sourcePackageSha256}\n[relatório](translation/final-review-2026-10-07.json)`;
const changelog = `# Histórico\n\n## v1.0.20\n\n${body}\n\n## v1.0.19\n\nVersão anterior.\n`;

test('release metadata accepts exact version and explicit unknown game version', () => {
  assert.equal(validateReleaseMetadata(metadata), metadata);
});
test('release metadata rejects unsafe tags, titles, paths and missing status', () => {
  for (const patch of [{tag: 'v1.0'}, {tag: 'v01.0.20'}, {title: 'v1.0.20 x\ninjected'}, {gameTested: null}, {sourceManifest: '../outside'}, {pakSha256: 'bad'}, {pakBytes: 0}, {gameVersion: ''}]) {
    assert.throws(() => validateReleaseMetadata({...metadata, ...patch}));
  }
});
test('tag push validates one matching release', () => {
  assert.equal(validateTrigger({eventName: 'push', ref: 'refs/tags/v1.0.20'}, metadata.tag), metadata.tag);
});
test('manual main release validates one explicit tag', () => {
  assert.equal(validateTrigger({eventName: 'workflow_dispatch', ref: 'refs/heads/main', manualTag: metadata.tag}, metadata.tag), metadata.tag);
});
test('branch pushes, PRs and manual non-main releases cannot publish', () => {
  for (const input of [{eventName: 'push', ref: 'refs/heads/main'}, {eventName: 'push', ref: 'refs/heads/update/review'}, {eventName: 'pull_request', ref: 'refs/pull/1/merge'}, {eventName: 'workflow_dispatch', ref: 'refs/heads/update/review', manualTag: metadata.tag}]) {
    assert.throws(() => validateTrigger(input, metadata.tag));
  }
});
test('missing, mismatched and malformed requested tags cannot publish', () => {
  for (const manualTag of [undefined, '', 'v1.0.19', 'v1.0.20;echo unsafe', 'v1.0']) {
    assert.throws(() => validateTrigger({eventName: 'workflow_dispatch', ref: 'refs/heads/main', manualTag}, metadata.tag));
  }
  assert.throws(() => validateTrigger({eventName: 'push', ref: 'refs/tags/v1.0.19'}, metadata.tag));
});
test('notes include only this release and use tag-specific absolute report links', () => {
  const notes = extractReleaseNotes(changelog, metadata);
  assert.ok(notes.includes(body.split('\n')[0]));
  assert.ok(!notes.includes('Versão anterior'));
  assert.ok(notes.includes(`/blob/v1.0.20/translation/final-review-2026-10-07.json`));
});
test('missing or duplicated release notes are rejected', () => {
  assert.throws(() => extractReleaseNotes('# none', metadata));
  assert.throws(() => extractReleaseNotes(changelog + '\n## v1.0.20\nagain', metadata));
});
test('notes accept technical-only scope without an announcement and require exact hashes', () => {
  assert.ok(extractReleaseNotes(changelog, metadata).includes('Validação técnica'));
  assert.throws(() => extractReleaseNotes(changelog.replace(metadata.pakSha256, 'wrong'), metadata));
  for (const claim of ['Testado no jogo.', 'Validada dentro do jogo.', 'Teste no jogo concluído.', 'Testes dentro do jogo aprovados.']) {
    const claimed = changelog.replace('Validação técnica de catálogos e integridade do pacote.', claim);
    assert.throws(() => extractReleaseNotes(claimed, metadata));
    assert.ok(extractReleaseNotes(claimed, {...metadata, gameTested: true}).includes(claim));
  }
});
test('package bytes produce a standard SHA-256 checksum', () => {
  assert.equal(validatePackageBytes(bytes, metadata), `${metadata.pakSha256}  default.pak\n`);
});
test('modified bytes or unexpected size cannot be published', () => {
  assert.throws(() => validatePackageBytes(Buffer.from('different bytes'), metadata));
  assert.throws(() => validatePackageBytes(bytes, {...metadata, pakBytes: bytes.length + 1}));
});
