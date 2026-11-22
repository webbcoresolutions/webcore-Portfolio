/**
 * Subsets the self-hosted fonts to the characters the site actually uses
 * (Basic Latin + Latin-1 + typographic punctuation and the few symbols in the UI),
 * and limits variable weight axes to the weights in use.
 *
 *   npm run fonts      → writes src/assets/fonts/*.woff2 (committed)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = (p) => path.join(root, 'node_modules', p);
const out = (f) => path.join(root, 'src/assets/fonts', f);

let text = '';
for (let c = 0x20; c <= 0x7e; c++) text += String.fromCharCode(c); // Basic Latin
for (let c = 0xa0; c <= 0xff; c++) text += String.fromCharCode(c); // Latin-1 (©, ·, °, accents)
text += '‘’“”–—…•·′″→←↑↓↗✓✦€™';

const fonts = [
  {
    src: nm('@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2'),
    dest: 'inter-tight-wght.woff2',
    axes: { wght: { min: 300, max: 700 } },
  },
  {
    src: nm('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'),
    dest: 'jetbrains-mono-wght.woff2',
    axes: { wght: { min: 400, max: 700 } },
  },
  {
    src: nm('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'),
    dest: 'instrument-serif-italic.woff2',
  },
];

for (const f of fonts) {
  const input = await fs.readFile(f.src);
  const output = await subsetFont(input, text, { targetFormat: 'woff2', ...(f.axes ? { variationAxes: f.axes } : {}) });
  await fs.writeFile(out(f.dest), output);
  console.log(`✓ ${f.dest}: ${(input.length / 1024).toFixed(1)} KB → ${(output.length / 1024).toFixed(1)} KB`);
}
