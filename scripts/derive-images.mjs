/**
 * Derives the responsive screenshot sizes from the captured originals:
 *   <slug>-960.webp        (from -1280)  — fills the 720→1280 gap for 1.5–2× phones
 *   <slug>-mobile-240.webp (from -mobile) — phone mock-ups render at ≤ 190px
 * Run automatically by `npm run screenshots`; safe to re-run.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'projects');
const files = await fs.readdir(dir);
let n = 0;
for (const f of files) {
  if (f.endsWith('-1280.webp')) {
    await sharp(path.join(dir, f)).resize(960).webp({ quality: 78 }).toFile(path.join(dir, f.replace('-1280', '-960')));
    n++;
  } else if (f.endsWith('-mobile.webp')) {
    await sharp(path.join(dir, f)).resize(240).webp({ quality: 80 }).toFile(path.join(dir, f.replace('-mobile', '-mobile-240')));
    n++;
  }
}
console.log(`✓ derived ${n} responsive screenshot variants`);
