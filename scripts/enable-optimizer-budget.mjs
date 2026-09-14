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

if (!source.includes(compileBefore) || !source.includes(runtimeBefore)) {
  throw new Error('benchmark harness does not match the expected candidate');
}
source = source.replace(compileBefore, compileAfter).replace(runtimeBefore, runtimeAfter);
writeFileSync(target, source, 'utf8');
