/**
 * Post-build step (runs after the client + SSR builds):
 *
 *  1. Pre-renders every page to static HTML (fast first paint, crawlable content).
 *  2. Inlines the (small) stylesheet so nothing blocks rendering.
 *  3. Generates the security + caching headers for every supported host,
 *     with a strict Content-Security-Policy that whitelists the inline boot
 *     script by its SHA-256 hash (no 'unsafe-inline' for scripts).
 *
 * Outputs: dist/**.html, dist/_headers (Netlify / Cloudflare Pages),
 *          vercel.json (Vercel), dist/serve.json (local `npm run serve`).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, '.ssr');

const pages = [
  { file: 'index.html', page: 'home' },
  { file: 'contact/index.html', page: 'contact' },
];

const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

const scriptHashes = new Set();
for (const { file, page } of pages) {
  const target = path.join(dist, file);
  let html = await fs.readFile(target, 'utf8');

  // 1. Pre-render
  const markup = render(page);
  if (!html.includes('<div id="root"></div>')) throw new Error(`No empty #root in ${file}`);
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

  // 2. Inline the stylesheet(s)
  const links = [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)];
  for (const [tag, href] of links) {
    const css = await fs.readFile(path.join(dist, href), 'utf8');
    // Disabled marker: never downloaded (HTML spec), but tells Vite's lazy-chunk
    // loader the stylesheet is already present, so it isn't fetched again.
    html = html.replace(tag, () => `<style>${css}</style><link rel="stylesheet" href="${href}" disabled>`);
  }

  // 2b. Load the app just after first paint. The pre-rendered page is already
  //     complete; deferring the module means nothing competes with first paint.
  //     (External file → covered by CSP 'self'; the inline boot script stays
  //     byte-identical, so its CSP hash is stable across builds.)
  const entry = html.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/);
  if (!entry) throw new Error(`No module entry in ${file}`);
  const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="(\/assets\/[^"]+\.js)">/g)].map((m) => m[1]);
  const loaderSrc =
    `(function(d){function go(){` +
    preloads.map((h) => `var l=d.createElement('link');l.rel='modulepreload';l.href=${JSON.stringify(h)};d.head.appendChild(l);`).join('') +
    `var s=d.createElement('script');s.type='module';s.src=${JSON.stringify(entry[1])};d.head.appendChild(s)}` +
    // Sequence: first paint → key above-the-fold image painted → start the app
    // (with a safety timeout so the app always starts).
    // Uses the browser's own paint signals (Paint Timing / LCP APIs) where available.
    `var started=false;function start(){if(started)return;started=true;setTimeout(go,0)}` +
    `function after(){var img=d.querySelector('img[fetchpriority=high]'),T=(window.PerformanceObserver&&PerformanceObserver.supportedEntryTypes)||[];` +
    `var type=img&&T.indexOf('largest-contentful-paint')>-1?'largest-contentful-paint':T.indexOf('paint')>-1?'paint':'';` +
    `if(!type){requestAnimationFrame(function(){setTimeout(start,50)})}else{try{var po=new PerformanceObserver(function(l){` +
    `if(l.getEntries().some(function(e){return type==='paint'?e.name==='first-contentful-paint':e.element===img})){po.disconnect();start()}});` +
    `po.observe({type:type,buffered:true})}catch(e){start()}}` +
    `setTimeout(start,2500)}` +
    `d.readyState==='loading'?d.addEventListener('DOMContentLoaded',after):after()})(document);`;
  const loaderName = `/assets/loader-${crypto.createHash('sha256').update(loaderSrc).digest('hex').slice(0, 10)}.js`;
  await fs.writeFile(path.join(dist, loaderName), loaderSrc);
  html = html.replace(entry[0], `<script defer src="${loaderName}"></script>`);
  for (const h of preloads) html = html.replace(`<link rel="modulepreload" crossorigin href="${h}">`, '');

  // 2c. Fonts: low-priority preload (they use font-display: swap, so text never waits for them).
  const fonts = [...new Set([...html.matchAll(/url\((\/assets\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  html = html.replace(
    '</title>',
    `</title>\n    ${fonts.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin fetchpriority="low">`).join('\n    ')}`,
  );

  // 3. Hash every inline script for the CSP
  for (const [, body] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    scriptHashes.add(`'sha256-${crypto.createHash('sha256').update(body).digest('base64')}'`);
  }

  await fs.writeFile(target, html);
  console.log(`✓ pre-rendered ${file} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, ${links.length} stylesheet inlined)`);
}

/* ------------------------------------------------------------------ */
/* Security + caching headers                                          */
/* ------------------------------------------------------------------ */
const env = Object.fromEntries(
  (await fs.readFile(path.join(root, '.env'), 'utf8').catch(() => ''))
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const endpoint = process.env.VITE_CONTACT_ENDPOINT || env.VITE_CONTACT_ENDPOINT || '';
const connect = ["'self'", endpoint && new URL(endpoint).origin].filter(Boolean).join(' ');

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...scriptHashes].join(' ')}`,
  // Inline style *attributes* are needed for animation; they cannot execute code.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${connect}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const security = {
  'Content-Security-Policy': csp,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
};
const cache = {
  html: 'public, max-age=0, must-revalidate',
  hashed: 'public, max-age=31536000, immutable', // /assets/* (content-hashed filenames)
  media: 'public, max-age=2592000, stale-while-revalidate=86400', // images, 30 days
};
const rules = [
  { source: '/(.*)', headers: { ...security, 'Cache-Control': cache.html } },
  { source: '/assets/(.*)', headers: { 'Cache-Control': cache.hashed } },
  { source: '/(projects|brand)/(.*)', headers: { 'Cache-Control': cache.media } },
  { source: '/(.*)\\.(png|jpg|webp|ico)', headers: { 'Cache-Control': cache.media } },
];
const kv = (o) => Object.entries(o).map(([key, value]) => ({ key, value }));

// Netlify / Cloudflare Pages
// (These hosts merge duplicate headers across matching rules, so the catch-all
//  carries no Cache-Control; HTML already defaults to revalidation there.)
const netlify = [
  ['/*', security],
  ['/assets/*', { 'Cache-Control': cache.hashed }],
  ['/projects/*', { 'Cache-Control': cache.media }],
  ['/brand/*', { 'Cache-Control': cache.media }],
]
  .map(([p, h]) => `${p}\n${Object.entries(h).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`)
  .join('\n\n');
await fs.writeFile(path.join(dist, '_headers'), `# Generated by scripts/prerender.mjs — do not edit by hand.\n${netlify}\n`);

// Vercel
await fs.writeFile(
  path.join(root, 'vercel.json'),
  JSON.stringify(
    {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      trailingSlash: true,
      headers: rules.map((r) => ({ source: r.source, headers: kv(r.headers) })),
    },
    null,
    2,
  ) + '\n',
);

// Local verification server (`npm run serve`)
await fs.writeFile(
  path.join(dist, 'serve.json'),
  JSON.stringify(
    {
      trailingSlash: true,
      headers: [
        { source: '**/*', headers: kv({ ...security, 'Cache-Control': cache.html }) },
        { source: 'assets/**', headers: kv({ 'Cache-Control': cache.hashed }) },
        { source: '{projects,brand}/**', headers: kv({ 'Cache-Control': cache.media }) },
      ],
    },
    null,
    2,
  ) + '\n',
);

await fs.rm(ssrDir, { recursive: true, force: true });
console.log(`✓ security headers written (CSP script hashes: ${scriptHashes.size}) → dist/_headers, vercel.json, dist/serve.json`);
