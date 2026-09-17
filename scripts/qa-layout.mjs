import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
let depth = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') depth++;
  if (css[i] === '}') depth--;
  if (depth < 0) throw new Error(`CSS brace underflow at ${i}`);
}
if (depth !== 0) throw new Error(`CSS brace imbalance: ${depth}`);
const jsx = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
for (const token of ['rateFlashcard','sidebar-toggle','FlashcardsHub','Calendar']) {
  if (!jsx.includes(token)) throw new Error(`Missing expected token: ${token}`);
}
console.log('LAYOUT_QA_OK');
