import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {checkTranslation} from './pack-translation.mjs';

const TAG = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const HASH = /^[0-9a-f]{64}$/;
function fail(message) { throw new Error(message); }

export function validateReleaseMetadata(metadata) {
  if (!metadata || metadata.schemaVersion !== 1 || !TAG.test(metadata.tag || '')) fail('Invalid release metadata/tag');
  if (typeof metadata.title !== 'string' || !metadata.title.startsWith(metadata.tag + ' ') || /[\r\n\x00]/.test(metadata.title)) fail('Invalid release title');
  if (typeof metadata.gameTested !== 'boolean') fail('Explicit gameTested boolean is required');
  if (metadata.gameVersion !== null && (typeof metadata.gameVersion !== 'string' || !metadata.gameVersion.trim())) fail('Invalid game version');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.sourceReferenceDate || '')) fail('Invalid source reference date');
  if (metadata.sourceManifest !== 'translation/source-manifest.json' || metadata.changelog !== 'CHANGELOG.md') fail('Unexpected release input path');
  if (!HASH.test(metadata.pakSha256 || '') || !HASH.test(metadata.sourcePackageSha256 || '')) fail('Invalid SHA-256 metadata');
  if (!Number.isSafeInteger(metadata.pakBytes) || metadata.pakBytes < 1 || !Number.isSafeInteger(metadata.pakFiles) || metadata.pakFiles < 1) fail('Invalid package size/inventory');
  return metadata;
}

export function validateTrigger({eventName, ref, manualTag}, expectedTag) {
  if (!TAG.test(expectedTag || '')) fail('Invalid expected release tag');
  let tag;
  if (eventName === 'push' && typeof ref === 'string' && ref.startsWith('refs/tags/')) tag = ref.slice('refs/tags/'.length);
  else if (eventName === 'workflow_dispatch' && ref === 'refs/heads/main') tag = manualTag;
  else fail('Release requires a version tag push or an explicit manual request on main');
  if (!TAG.test(tag || '') || tag !== expectedTag) fail('Requested tag must match translation/release.json exactly');
  return tag;
}

export function extractReleaseNotes(changelog, metadata) {
  const sections = [...changelog.matchAll(/^## (v\S+)\s*$/gm)];
  const matches = sections.filter(section => section[1] === metadata.tag);
  if (matches.length !== 1) fail('Expected exactly one changelog section for ' + metadata.tag);
  const section = matches[0];
  const next = sections.find(item => item.index > section.index);
  const notes = changelog.slice(section.index + section[0].length, next?.index ?? changelog.length).trim();
  if (!notes) fail('Release notes are empty');
  if (!notes.includes(metadata.pakSha256) || !notes.includes(metadata.sourcePackageSha256)) fail('Changelog hashes do not match release metadata');
  const assertsInGameTesting = /(?:testad[oa]s?|validad[oa]s?) (?:no|dentro do) jogo|testes? (?:no|dentro do) jogo (?:conclu[ií]d[oa]s?|aprovad[oa]s?|realizad[oa]s?)/i.test(notes);
  if (!metadata.gameTested && assertsInGameTesting) fail('Release cannot claim in-game testing without a recorded test');
  // Relative links from CHANGELOG.md do not resolve correctly from Release pages.
  const canonical = notes.replace(/\]\((translation\/[^)]+)\)/g,
    `](https://github.com/allanlopesprado/cta-goh-ptbr/blob/${metadata.tag}/$1)`);
  return canonical + '\n';
}

export function validatePackageBytes(bytes, metadata) {
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== metadata.pakBytes || hash !== metadata.pakSha256) fail('Built pak differs from expected release size/SHA-256');
  return `${hash}  default.pak\n`;
}

function safeDistTarget(repo, name) {
  const dist = path.join(repo, 'dist');
  if (!fs.lstatSync(dist).isDirectory() || fs.lstatSync(dist).isSymbolicLink()) fail('dist must be a regular directory');
  const target = path.join(dist, name);
  if (fs.existsSync(target) && (!fs.lstatSync(target).isFile() || fs.lstatSync(target).isSymbolicLink())) fail('Release output must be a regular file');
  return target;
}

function atomicOutput(target, text) {
  const temporary = path.join(path.dirname(target), '.' + path.basename(target) + '.' + randomUUID() + '.tmp');
  try {
    fs.writeFileSync(temporary, text, {encoding: 'utf8', flag: 'wx'});
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function checkRelease(repo = process.cwd(), requestedTag) {
  const root = fs.realpathSync(repo);
  const metadata = validateReleaseMetadata(JSON.parse(fs.readFileSync(path.join(root, 'translation/release.json'), 'utf8')));
  if (requestedTag !== undefined && requestedTag !== metadata.tag) fail('Requested tag differs from release metadata');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, metadata.sourceManifest), 'utf8'));
  if (manifest.package.sha256.toLowerCase() !== metadata.sourcePackageSha256 || manifest.referenceDate !== metadata.sourceReferenceDate) fail('Source manifest differs from release metadata');
  const checked = checkTranslation(root);
  if (checked.files !== metadata.pakFiles) fail('Package inventory differs from release metadata');
  const checksum = validatePackageBytes(fs.readFileSync(path.join(root, 'dist/default.pak')), metadata);
  const notes = extractReleaseNotes(fs.readFileSync(path.join(root, metadata.changelog), 'utf8'), metadata);
  return {metadata, checksum, notes};
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length > 2 || !['--check', '--prepare'].includes(argv[0]) || (argv[1] !== undefined && !TAG.test(argv[1]))) fail('Usage: node tools/release-translation.mjs --check|--prepare [vX.Y.Z]');
  const result = checkRelease(process.cwd(), argv[1]);
  if (argv[0] === '--prepare') {
    const checksumTarget = safeDistTarget(process.cwd(), 'default.pak.sha256');
    const notesTarget = safeDistTarget(process.cwd(), 'release-notes.md');
    atomicOutput(checksumTarget, result.checksum);
    atomicOutput(notesTarget, result.notes);
  }
  console.log(JSON.stringify({tag: result.metadata.tag, pakSha256: result.metadata.pakSha256, pakBytes: result.metadata.pakBytes, gameTested: result.metadata.gameTested, mode: argv[0]}, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
