/**
 * Builds every logo asset from the official source file.
 *
 *   npm run logo                       # uses ./webcore-solutions-logo.png
 *   npm run logo -- path/to/logo.png
 *
 * Outputs (all derived from the same pixels, never redrawn):
 *   public/logo.webp                   trimmed logo used across the site
 *   public/brand/logo-{mark,tag,word}.webp  lossless layers for the 3D hero
 *   public/favicon.png, apple-touch-icon.png
 *   (the social share image public/og-image.jpg is your own artwork and is left untouched)
 *
 * If the logo artwork changes layout, update TAG / SPLIT below and the
 * matching percentages printed at the end in src/styles/global.css (.brand__layer--*).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, process.argv[2] || 'webcore-solutions-logo.png');

// Trim box (source px) and layer geometry (trimmed px) for the current artwork.
const TRIM = { left: 20, top: 141, width: 2490, height: 610 };
const TAG = { x: 546, y: 0, w: 406, h: 189 }; // the </> mark
const SPLIT = 965; // x where the emblem ends and the wordmark begins

const out = (p) => path.join(root, 'public', p);
await fs.mkdir(out('brand'), { recursive: true });

const trimmed = await sharp(source).extract(TRIM).png().toBuffer();
const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

await sharp(trimmed).webp({ quality: 95, alphaQuality: 100, effort: 6 }).toFile(out('logo.webp'));
// Lightweight 800px version for every place the logo is shown at ≤ 400px (header, footer, curtain, glow).
await sharp(trimmed).resize(800).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out('brand/logo-800.webp'));
await sharp(trimmed).resize(400).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out('brand/logo-400.webp'));

// Emblem with the </> cleared, so the two can move independently.
const mark = Buffer.from(data);
for (let y = TAG.y; y < TAG.y + TAG.h; y++)
  for (let x = TAG.x; x < TAG.x + TAG.w; x++) mark[(y * W + x) * 4 + 3] = 0;
await sharp(mark, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: 0, top: 0, width: SPLIT, height: H })
  .webp({ lossless: true })
  .toFile(out('brand/logo-mark.webp'));
await sharp(trimmed).extract({ left: TAG.x, top: TAG.y, width: TAG.w, height: TAG.h }).webp({ lossless: true }).toFile(out('brand/logo-tag.webp'));
await sharp(trimmed).extract({ left: SPLIT, top: 0, width: W - SPLIT, height: H }).webp({ lossless: true }).toFile(out('brand/logo-word.webp'));

// Half-size layer variants for phones / smaller screens (served via srcset).
for (const name of ['mark', 'word', 'tag']) {
  const file = out(`brand/logo-${name}.webp`);
  const { width } = await sharp(file).metadata();
  const half = Math.round(width / 2);
  await sharp(file).resize(half).webp({ lossless: true }).toFile(out(`brand/logo-${name}-${half}.webp`));
}

// Verify the layers recompose the original exactly (alpha-weighted).
const comp = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: out('brand/logo-mark.webp'), left: 0, top: 0 },
    { input: out('brand/logo-word.webp'), left: SPLIT, top: 0 },
    { input: out('brand/logo-tag.webp'), left: TAG.x, top: TAG.y },
  ])
  .raw()
  .toBuffer();
let maxDiff = 0;
for (let i = 0; i < comp.length; i += 4) {
  const a1 = data[i + 3] / 255;
  const a2 = comp[i + 3] / 255;
  maxDiff = Math.max(maxDiff, Math.abs(data[i + 3] - comp[i + 3]));
  for (let c = 0; c < 3; c++) maxDiff = Math.max(maxDiff, Math.abs(data[i + c] * a1 - comp[i + c] * a2));
}
if (maxDiff > 1) throw new Error(`Layers do not recompose the logo (max diff ${maxDiff})`);

// Icons from the emblem.
const emblem = await sharp(trimmed).extract({ left: 0, top: 0, width: SPLIT, height: H }).png().toBuffer();
const icon = async (size, file, bg) =>
  sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([
      {
        input: await sharp(emblem)
          .resize(Math.round(size * 0.86), Math.round(size * 0.86), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(out(file));
await icon(64, 'favicon.png', { r: 0, g: 0, b: 0, alpha: 0 });
await icon(180, 'apple-touch-icon.png', { r: 255, g: 255, b: 255, alpha: 1 });
const pct = (v, t) => ((v / t) * 100).toFixed(4) + '%';
console.log(`✓ logo assets built from ${path.basename(source)} (${W}×${H}, layer diff ${maxDiff.toFixed(2)})`);
console.log(`  aspect-ratio: ${W} / ${H}`);
console.log(`  mark: left 0; width ${pct(SPLIT, W)}`);
console.log(`  word: left ${pct(SPLIT, W)}; width ${pct(W - SPLIT, W)}`);
console.log(`  tag:  left ${pct(TAG.x, W)}; top ${pct(TAG.y, H)}; width ${pct(TAG.w, W)}; height ${pct(TAG.h, H)}`);
