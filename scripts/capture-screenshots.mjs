/**
 * Captures real screenshots of every project in src/data/projects.ts.
 *
 *   npm run screenshots            # all projects
 *   npm run screenshots -- gulfnext  # only slugs containing "gulfnext"
 *
 * Uses the locally installed Google Chrome (puppeteer-core) and writes
 * optimised WebP files to public/projects/:
 *   <slug>-1280.webp / <slug>-720.webp   desktop above-the-fold (16:10)
 *   <slug>-full.webp                     tall capture used for hover-scroll
 *   <slug>-mobile.webp                   390px mobile viewport
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'projects');
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Parse slugs/urls out of the projects data file so there is one source of truth.
const src = await fs.readFile(path.join(root, 'src/data/projects.ts'), 'utf8');
const projects = [...src.matchAll(/slug:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'/g)].map(
  ([, slug, url]) => ({ slug, url }),
);
const filter = process.argv[2];
const queue = filter ? projects.filter((p) => p.slug.includes(filter)) : projects;

await fs.mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--no-first-run'],
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function settle(page) {
  // Walk the page to trigger lazy-loading / reveal-on-scroll, then return to top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < Math.min(document.body.scrollHeight, 9000); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
  });
  await wait(1800);
}

async function open(url, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.setUserAgent(
    viewport.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  );
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await wait(2500);
  await settle(page);
  return page;
}

for (const { slug, url } of queue) {
  process.stdout.write(`→ ${slug} (${url}) … `);
  try {
    // Desktop
    const page = await open(url, { width: 1440, height: 900, deviceScaleFactor: 1 });
    const fold = await page.screenshot({ type: 'png' });
    const height = await page.evaluate(() =>
      Math.min(document.documentElement.scrollHeight, 4200),
    );
    const full = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1440, height: Math.max(height, 900) },
      captureBeyondViewport: true,
    });
    await page.close();

    for (const w of [1280, 720]) {
      await sharp(fold).resize(w).webp({ quality: 80 }).toFile(path.join(outDir, `${slug}-${w}.webp`));
    }
    await sharp(full).resize(900).webp({ quality: 72 }).toFile(path.join(outDir, `${slug}-full.webp`));

    // Mobile
    const m = await open(url, {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await m.screenshot({ type: 'png' });
    await m.close();
    await sharp(mobile).resize(420).webp({ quality: 78 }).toFile(path.join(outDir, `${slug}-mobile.webp`));

    console.log('ok');
  } catch (err) {
    console.log('FAILED', err.message);
  }
}

await browser.close();
await import('./derive-images.mjs');
