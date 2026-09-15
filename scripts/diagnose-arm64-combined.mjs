import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const finalExpression = 'fannkuch(9) + fannkuch(9) + spectral_norm() + n_body(200000)';
// These remain private. Only their SHA-256 and byte count leave the checkout.
export const artifactNames = Object.freeze([
  'typed-ir.json', 'machine-ir.json', 'arm64-code.bin',
  'arm64-data.bin', 'arm64-manifest.json',
]);

export function diagnosticCases(source) {
  const suffix = /::[^\r\n]*\s*$/;
  const match = source.match(suffix);
  if (!match || match[0].trim() !== `:: ${finalExpression}`) {
    throw new Error('Published combined source changed; review diagnostic expressions.');
  }
  return new Map([
    ['combined', source],
    ...[
      ['spectral', 'spectral_norm()'],
      ['nbody', 'n_body(200000)'],
      ['fann', 'fannkuch(9)'],
      ['twoparts', 'spectral_norm() + n_body(200000)'],
    ].map(([name, expression]) => [name, source.replace(suffix, `:: ${expression}\n`)]),
  ]);
}

function main() {
  if (process.platform !== 'darwin' || process.arch !== 'arm64') {
    throw new Error('Diagnostic requires native macOS ARM64.');
  }
  const [sourceArg, compilerArg, outputArg] = process.argv.slice(2);
  if (!sourceArg || !compilerArg || !outputArg) {
    throw new Error('Usage: diagnose-arm64-combined.mjs SOURCE_ROOT COMPILER OUTPUT');
  }
  const sourceRoot = resolve(sourceArg);
  const compiler = resolve(compilerArg);
  const output = resolve(outputArg);
  const work = join(sourceRoot, '.benchmark-arm64-diagnostic');
  mkdirSync(work, { recursive: true });
  mkdirSync(output, { recursive: true });
  const source = readFileSync(join(sourceRoot,
    'benchmarks/core-comparison/published/combined-kernels-large/vkf.vkf'), 'utf8');
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8' });
  if (revision.status !== 0) throw new Error('Cannot resolve compiler source revision.');
  const report = {
    sourceRevision: revision.stdout.trim(), platform: process.platform, arch: process.arch,
    compilerSha256: createHash('sha256').update(readFileSync(compiler)).digest('hex'),
    cases: [],
  };
  for (const [name, text] of diagnosticCases(source)) {
    const file = join(work, `${name}.vkf`);
    writeFileSync(file, text);
    const result = spawnSync(compiler,
      ['--aot', '--diagnostics', '--optimizer-policy', 'auto', '--source', file],
      { cwd: sourceRoot, encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024 });
    const row = { name, compileStatus: result.status, artifacts: {} };
    const build = join(work, '.vkfbuild', name);
    for (const artifact of artifactNames) {
      const path = join(build, artifact);
      if (!existsSync(path)) continue;
      const bytes = readFileSync(path);
      row.artifacts[artifact] = {
        sha256: createHash('sha256').update(bytes).digest('hex'), byteCount: bytes.length,
      };
    }
    if (result.status === 0) {
      const run = spawnSync(join(build, name), [],
        { cwd: sourceRoot, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 });
      row.runStatus = run.status;
      const text = (run.stdout ?? '').trim();
      row.value = /^[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(text) ? Number(text) : null;
    }
    report.cases.push(row);
    console.log(JSON.stringify(row));
    writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.cases.some(row => row.compileStatus !== 0 || row.runStatus !== 0 || row.value === null)) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
