import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class ManifestError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ManifestError';
    this.code = code;
  }
}

export function validateManifest(manifestPath, baseDir) {
  if (!fs.existsSync(manifestPath)) {
    throw new ManifestError('Manifest file is absent', 'ABSENT_MANIFEST');
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch (err) {
    throw new ManifestError('Manifest is invalid JSON', 'INVALID_MANIFEST');
  }

  if (!manifest.provenance) {
    throw new ManifestError('Missing provenance in manifest', 'MISSING_PROVENANCE');
  }

  if (!manifest.sources || !Array.isArray(manifest.sources)) {
    throw new ManifestError('Manifest sources missing or invalid', 'INVALID_SOURCES');
  }

  for (const source of manifest.sources) {
    const sourcePath = path.resolve(baseDir, source.path);
    if (!fs.existsSync(sourcePath)) {
      throw new ManifestError(`Absent source: ${source.path}`, 'ABSENT_SOURCE');
    }

    const content = fs.readFileSync(sourcePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    if (hash !== source.checksum) {
      throw new ManifestError(`Checksum drift for source: ${source.path}. Expected ${source.checksum}, got ${hash}`, 'CHECKSUM_DRIFT');
    }
  }

  return true;
}
