import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('version alignment', () => {
  const dspPkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  const rootPkg = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'));

  it('DSP package has a semver version', () => {
    expect(dspPkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('DSP version is at least 1.0.0', () => {
    const major = parseInt(dspPkg.version.split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it('core dependency version matches core package.json', () => {
    const corePkg = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'voice-engine-core', 'package.json'), 'utf-8')
    );
    expect(dspPkg.dependencies['@mcptoolshop/voice-engine-core']).toBe(corePkg.version);
  });
});
