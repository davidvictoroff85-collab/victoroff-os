import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest, ManifestError } from './manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('validateManifest - success', () => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  assert.ok(validateManifest(manifestPath, __dirname));
});

test('validateManifest - missing provenance', () => {
  const testDir = path.join(__dirname, 'test-tmp');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const manifestPath = path.join(testDir, 'manifest-no-prov.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    classification: 'public-safe-synthetic',
    sources: []
  }));

  assert.throws(
    () => validateManifest(manifestPath, testDir),
    (err) => err instanceof ManifestError && err.code === 'MISSING_PROVENANCE' && err.message === 'Missing provenance in manifest'
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('validateManifest - absent source', () => {
  const testDir = path.join(__dirname, 'test-tmp-2');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const manifestPath = path.join(testDir, 'manifest-absent-src.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    classification: 'public-safe-synthetic',
    provenance: 'test',
    sources: [{ path: 'does-not-exist.txt', checksum: '123' }]
  }));

  assert.throws(
    () => validateManifest(manifestPath, testDir),
    (err) => err instanceof ManifestError && err.code === 'ABSENT_SOURCE' && err.message.includes('Absent source')
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('validateManifest - checksum drift', () => {
  const testDir = path.join(__dirname, 'test-tmp-3');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const manifestPath = path.join(testDir, 'manifest-drift.json');
  const sourcePath = path.join(testDir, 'source.txt');
  fs.writeFileSync(sourcePath, 'test content');

  fs.writeFileSync(manifestPath, JSON.stringify({
    classification: 'public-safe-synthetic',
    provenance: 'test',
    sources: [{ path: 'source.txt', checksum: 'invalid-checksum' }]
  }));

  assert.throws(
    () => validateManifest(manifestPath, testDir),
    (err) => err instanceof ManifestError && err.code === 'CHECKSUM_DRIFT' && err.message.includes('Checksum drift')
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});
