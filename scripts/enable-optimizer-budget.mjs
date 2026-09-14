import { readFileSync, writeFileSync } from 'node:fs';

const [target, benchmark = ''] = process.argv.slice(2);
if (!target) throw new Error('usage: node enable-optimizer-budget.mjs run.mjs [benchmark]');

const combined = benchmark.startsWith('combined-kernels');
const optimizerRuns = combined ? '10' : '1000';
const optimizerTimeLimitMs = combined ? '5000' : '60000';

let source = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
const compileBefore = "return ['--aot', '--optimizer-policy', 'auto', '--source', source];";
const compileAfter = `return [
    '--aot', '--optimizer-policy', 'auto',
    '--optimizer-runs', '${optimizerRuns}',
    '--optimizer-time-limit-ms', '${optimizerTimeLimitMs}',
    '--source', source
  ];`;
const compileEmbedded = `    '--optimizer-runs', '1000',
    '--optimizer-time-limit-ms', '60000',`;
const compileEmbeddedAfter = `    '--optimizer-runs', '${optimizerRuns}',
    '--optimizer-time-limit-ms', '${optimizerTimeLimitMs}',`;
const runtimeBefore = `'--optimizer-policy', reuseFunctionPolicy || optimizerPolicy === 'mixed'
      ? 'auto' : optimizerPolicy,
    '--source', source`;
const runtimeAfter = `'--optimizer-policy', reuseFunctionPolicy || optimizerPolicy === 'mixed'
      ? 'auto' : optimizerPolicy,
    ...((reuseFunctionPolicy || optimizerPolicy === 'mixed')
      ? ['--optimizer-runs', '${optimizerRuns}',
          '--optimizer-time-limit-ms', '${optimizerTimeLimitMs}']
      : []),
    '--source', source`;
const runtimeEmbedded = `? ['--optimizer-runs', '1000', '--optimizer-time-limit-ms', '60000']`;
const runtimeEmbeddedAfter = `? ['--optimizer-runs', '${optimizerRuns}',
          '--optimizer-time-limit-ms', '${optimizerTimeLimitMs}']`;

let compilePatched = false;
let runtimePatched = false;
if (source.includes(compileBefore)) {
  source = source.replace(compileBefore, compileAfter);
  compilePatched = true;
} else if (source.includes(compileEmbedded)) {
  source = source.replace(compileEmbedded, compileEmbeddedAfter);
  compilePatched = true;
}
if (source.includes(runtimeBefore)) {
  source = source.replace(runtimeBefore, runtimeAfter);
  runtimePatched = true;
} else if (source.includes(runtimeEmbedded)) {
  source = source.replace(runtimeEmbedded, runtimeEmbeddedAfter);
  runtimePatched = true;
}
if (!compilePatched || !runtimePatched) {
  throw new Error('benchmark harness does not match the expected candidate');
}
writeFileSync(target, source, 'utf8');
