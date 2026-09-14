import { createDecipheriv } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
const encodedKey = process.env.VKF_CANDIDATE_SOURCE_KEY ?? '';
if (!input || !output || !/^[0-9a-f]{64}$/iu.test(encodedKey)) {
  throw new Error(
    'usage: VKF_CANDIDATE_SOURCE_KEY=<64 hex chars> node ' +
    'decrypt-candidate-source.mjs INPUT OUTPUT'
  );
}

const encrypted = readFileSync(input);
if (encrypted.length < 28) throw new Error('encrypted source asset is truncated');
const nonce = encrypted.subarray(0, 12);
const tag = encrypted.subarray(12, 28);
const ciphertext = encrypted.subarray(28);
const decipher = createDecipheriv(
  'aes-256-gcm', Buffer.from(encodedKey, 'hex'), nonce
);
decipher.setAuthTag(tag);
writeFileSync(output, Buffer.concat([
  decipher.update(ciphertext), decipher.final()
]));
