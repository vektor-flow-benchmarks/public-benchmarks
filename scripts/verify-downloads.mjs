import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const archives = process.argv.slice(2);
if (archives.length === 0) {
  throw new Error('usage: node scripts/verify-downloads.mjs archive [...]');
}

for (const archive of archives) {
  const checksumFile = `${archive}.sha256`;
  const expected = readFileSync(checksumFile, 'utf8').trim().split(/\s+/, 1)[0];
  if (!/^[0-9a-f]{64}$/u.test(expected)) {
    throw new Error(`${checksumFile} does not contain one SHA-256 digest`);
  }
  const actual = createHash('sha256').update(readFileSync(archive)).digest('hex');
  if (actual !== expected) {
    throw new Error(`${basename(archive)} SHA-256 mismatch`);
  }
  console.log(`${basename(archive)} ${actual}`);
}
