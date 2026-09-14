import { readFileSync, writeFileSync } from 'node:fs';

const [target] = process.argv.slice(2);
if (!target) throw new Error('usage: node enable-optimizer-budget.mjs run.mjs');

let source = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
const compileBefore = "return ['--aot', '--optimizer-policy', 'auto', '--source', source];";
const compileAfter = `return [
    '--aot', '--optimizer-policy', 'auto',
    '--optimizer-runs', '10', '--optimizer-time-limit-ms', '5000',
    '--source', source
  ];`;
const runtimeBefore = `'--optimizer-policy', reuseFunctionPolicy || optimizerPolicy === 'mixed'
      ? 'auto' : optimizerPolicy,
    '--source', source`;
const runtimeAfter = `'--optimizer-policy', reuseFunctionPolicy || optimizerPolicy === 'mixed'
      ? 'auto' : optimizerPolicy,
    ...((reuseFunctionPolicy || optimizerPolicy === 'mixed')
      ? ['--optimizer-runs', '10', '--optimizer-time-limit-ms', '5000']
      : []),
    '--source', source`;

if (!source.includes(compileBefore) || !source.includes(runtimeBefore)) {
  throw new Error('benchmark harness does not match the expected candidate');
}
source = source.replace(compileBefore, compileAfter).replace(runtimeBefore, runtimeAfter);
writeFileSync(target, source, 'utf8');
