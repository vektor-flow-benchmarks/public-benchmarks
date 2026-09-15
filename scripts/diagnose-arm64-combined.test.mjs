import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { artifactNames, diagnosticCases } from './diagnose-arm64-combined.mjs';

test('component probes preserve every function definition', () => {
  const prefix = 'sample() -> num:\n    @: 3\n\n';
  const original = `${prefix}:: fannkuch(9) + fannkuch(9) + spectral_norm() + n_body(200000)\n`;
  const cases = diagnosticCases(original);
  assert.equal(cases.size, 5);
  assert.equal(cases.get('combined'), original);
  assert.equal(cases.get('nbody'), `${prefix}:: n_body(200000)\n`);
  for (const source of cases.values()) assert.ok(source.startsWith(prefix));
  assert.throws(() => diagnosticCases(`${prefix}:: changed()\n`), /source changed/);
});

test('artifact allowlist excludes compiler source and checkout contents', () => {
  assert.deepEqual(artifactNames, [
    'typed-ir.json', 'machine-ir.json', 'arm64-code.bin',
    'arm64-data.bin', 'arm64-manifest.json',
  ]);
});

test('only numeric report is published; IR and compiler logs stay private', () => {
  const script = readFileSync(new URL('./diagnose-arm64-combined.mjs', import.meta.url), 'utf8');
  assert.ok(!script.includes('copyFileSync'));
  assert.ok(!script.includes('compile.log'));
  assert.ok(!script.includes('row.stdout'));
  const workflow = readFileSync(new URL('../.github/workflows/diagnose-arm64-combined.yml', import.meta.url), 'utf8');
  assert.match(workflow, /path: diagnostic-output\/report\.json/);
});
