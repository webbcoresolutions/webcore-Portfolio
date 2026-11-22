# Webcore Solutions: Portfolio

A scroll-choreographed 3D portfolio for [Webcore Solutions](https://webcoreuae.com/): a cinematic one-page home (`/`) plus a dedicated contact page (`/contact/`).

**Stack:** Vite · React 18 (pre-rendered at build time, then hydrated) · TypeScript · Three.js (hero + globe, lazy-loaded) · GSAP ScrollTrigger · Lenis smooth scroll · self-hosted, subset fonts (Inter Tight, Instrument Serif, JetBrains Mono).

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (client-rendered, for development)
npm run build      # production build → dist/ (pre-rendered, headers generated)
npm run serve      # serve dist/ with the real security + cache headers → http://localhost:4180
```

Always check performance and security on `npm run serve`, not `npm run dev` or `npm run preview`
(neither of those applies the headers or the pre-rendered HTML).

### What `npm run build` does

1. `tsc -b`: type-check.
2. `vite build`: client bundles for both pages.
3. `vite build --ssr src/entry-server.tsx`: a build-time renderer.
4. `scripts/prerender.mjs`:
   - **Pre-renders** both pages to full HTML (instant first paint; content readable without JS).
   - **Inlines the stylesheet** (no render-blocking CSS request).
   - **Loads the app after first paint** via a tiny deferred loader (`/assets/loader-*.js`), so nothing competes with the first paint. The app then hydrates the existing HTML.
   - **Generates the security + cache headers** for every host: `vercel.json` (Vercel), `dist/_headers` (Netlify / Cloudflare Pages) and `dist/serve.json` (local).

> `vercel.json` is regenerated on every build. If you deploy to Vercel, commit it after building.

## Deploy

Any static host works; `dist/` is the site. `/contact/` is a real folder, so no rewrites are needed.

| Host | Steps |
|---|---|
| **Vercel** | Build command `npm run build`, output `dist`. Headers come from the committed `vercel.json`. |
| **Netlify / Cloudflare Pages** | Build command `npm run build`, publish `dist`. Headers come from `dist/_headers`. |
| Other (Apache, Nginx, S3…) | Upload `dist/` and copy the headers listed in `dist/_headers` into the server config. |

Before building for production, set in `.env` (see `.env.example`):

- `VITE_SITE_URL=https://your-domain.com`: absolute social-share image URL.
- `VITE_CONTACT_ENDPOINT=…` (optional): form service; its origin is automatically allowed in the CSP.

HTTPS and the HTTP → HTTPS redirect are provided by the host (all three above do this automatically).

## Quality

Measured on the production build served with its real headers (`npm run serve`):

| | Result |
|---|---|
| **Lighthouse**, home + contact, mobile + desktop | Performance **100** · Accessibility **100** · Best Practices **100** · SEO **100** |
| Mobile metrics | FCP 0.8 s · LCP 1.7–1.8 s · TBT 20 ms · CLS 0 |
| **axe-core** (WCAG 2.0/2.1/2.2 A + AA + best practices) | **0 violations**: 96 scans (2 pages × desktop / mobile / reduced motion × 16 scroll positions) |
| **Mozilla HTTP Observatory** | **A+ (130)**, 11/11 tests, over HTTPS in production |
| `npm audit` | 0 vulnerabilities |

### Performance

- Pre-rendered HTML + inlined CSS; the app is loaded after first paint.
- WebGL scenes (hero, globe) load lazily once the page is idle, and pause off-screen.
- Fonts are self-hosted, subset to the characters used, and variable axes trimmed (`npm run fonts`).
- Responsive images everywhere (`srcset`): 720 / 960 / 1280 screenshots, 240 / 420 phone mock-ups, half-size logo layers, 400 / 800 logos.
- Hashed assets are cached for a year (immutable); HTML always revalidates.

### Security

- **Content-Security-Policy:** `default-src 'self'`. Scripts are limited to the site itself plus the inline boot script, allowed by its SHA-256 hash (no `'unsafe-inline'` for scripts). No third-party scripts, fonts or requests.
- **HSTS** (2 years), **X-Frame-Options DENY** + `frame-ancestors 'none'`, **nosniff**, **Referrer-Policy**, **Permissions-Policy**, **COOP / CORP**, **Origin-Agent-Cluster**.
- **Form:** honeypot + minimum fill time (spam), `maxLength` limits, line breaks stripped from single-line fields (header injection), no double submissions.
- `/.well-known/security.txt` for responsible disclosure (renew the `Expires` date yearly).

### Accessibility

- WCAG 2.2 AA: contrast-checked colours (project accents use `--accent-text`, deepened to ≥ 4.5:1), a skip link, visible focus on every control, labelled fields with announced errors, 44 px touch targets.
- Text is never left half-transparent by scroll animations (reveals use motion and masks, not opacity).
- **Motion:** respects `prefers-reduced-motion` (static layout), plus a **Pause animations** control in the footer that freezes CSS animations and the WebGL scenes. The choice is remembered.
- Works without JavaScript (pre-rendered content, static logo).

## Experience

| # | Section | Highlights |
|---|---------|-----------|
| 1 | Hero | Cinematic opening (light beam → W rises from depth → wordmark wipe → `</>` drops in). The logo is three pixel-exact layers that separate in 3D on scroll, then recombine and dock into the header. Cursor-driven key light, cast shadow, floor reflection, perspective stage floor, WebGL particles with depth-of-field bokeh. |
| 2 | Introduction | Scroll-scrubbed 3D word reveals, exploded "layers" visual, count-up stats, kinetic band. |
| 3 | Projects | 4 editorial spreads with distinct compositions + a pinned horizontal gallery (desktop). Real screenshots rise in with perspective; hover-to-scroll full-page previews, 3D tilt, glare, a "Visit" cursor badge (whole preview is clickable), phone mock-ups and a wayfinding HUD. |
| 4 | Services | Pinned 3D drum that rotates with scroll (desktop); 3D list on mobile. |
| 5 | CTA | Card expands to full-bleed, perspective grid floor, magnetic buttons. |

**Header:** logo, *Visit Our Website* (webcoreuae.com, new tab) and *Contact*. A hairline in the bar shows scroll progress.
**Footer:** brand, *Visit Our Website* / *Start a Project*, directory (explore, offices with live local times, contact, socials) and a scroll-inked signature line.

### Contact page (`/contact/`)

Navy hero with an interactive 3D globe (offices in Dubai HQ, United Kingdom and Pakistan, linked by animated arcs), then:

- **Where we are**: bento grid with a featured Dubai HQ card (live clock, beacon, call button), UK and Pakistan office cards, and Email / WhatsApp channel cards with a cursor spotlight.
- **Your project**: "How it works" process panel beside the brief form (project-type chips, live brief-completeness meter).
- **Good to know**: FAQ accordion (copy in `src/pages/ContactPage.tsx`; please review it).
- **Ready when you are**: closing panel with the email, copy-to-clipboard and WhatsApp.
Pages are linked with a brand-curtain transition (`goToPage` in `src/lib/motion.ts`). Links such as `/#work` deep-link into the home page.

All scroll animations are scrubbed to scroll position, so they play forward on scroll-down and reverse on scroll-up.
Sections are transparent over one fixed backdrop (`src/components/Backdrop.tsx`) whose colour is scrubbed light → navy → light through brand blues, so the page reads as one continuous scene rather than stacked blocks.
Users with `prefers-reduced-motion` get a static layout: no pinning, no WebGL loop, no smooth scrolling. Anyone can also pause all animations from the footer.

## Project screenshots

Screenshots in `public/projects/` are real captures of each live site, taken with local Google Chrome:

```bash
npm run screenshots              # re-capture all projects
npm run screenshots -- zillay    # re-capture a single project (slug match)
```

Each project uses `<slug>-1280.webp`, `<slug>-720.webp`, `<slug>-full.webp` (hover-scroll) and `<slug>-mobile.webp`;
`<slug>-960.webp` and `<slug>-mobile-240.webp` are derived automatically (`npm run images`).
To use your own images, replace those files with the same names. If an image is missing, a clean placeholder is shown instead.
Project names, copy and accent colours live in `src/data/projects.ts`.

## Contact form

There is no backend in this project, so the form never pretends to send anything:

- The form lives on `/contact/` (`src/components/ContactForm.tsx`).
- **Default:** on submit, the visitor's email app opens with the enquiry pre-filled and addressed to `info@webcoreuae.com`, and the page says so.
- **With a form service:** copy `.env.example` to `.env` and set `VITE_CONTACT_ENDPOINT` to any endpoint that accepts JSON POSTs (e.g. Formspree `https://formspree.io/f/xxxx`). The success message is shown only when the endpoint returns a 2xx response.

## Social share image

`public/og-image.jpg` (1200×630) is generated from your artwork `og-image.png` and used for link previews on both pages (Open Graph + Twitter card tags).
LinkedIn, Facebook and WhatsApp require an **absolute** image URL, so set your live address before building:

```bash
VITE_SITE_URL=https://your-domain.com npm run build
```

(or put `VITE_SITE_URL=` in `.env`). Without it, the tags fall back to a relative path.

## Brand assets

The official logo source is `webcore-solutions-logo.png`. Every logo asset is generated from it:

```bash
npm run logo
```

- `public/logo.webp`: the trimmed full-resolution logo; `public/brand/logo-{400,800}.webp`: smaller versions for the header, footer and glow.
- `public/brand/logo-{mark,tag,word}.webp` (+ half-size variants): lossless cuts of the same file (the W, the `</>` and the wordmark). The script verifies they recompose the original pixel-for-pixel; they exist only so the hero can move the parts in depth.
- `favicon.png` and `apple-touch-icon.png`. (The social image `og-image.jpg` is your own artwork and is never overwritten.)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `serve` | Develop / production build / serve the build with real headers |
| `npm run logo` | Rebuild all logo assets from `webcore-solutions-logo.png` |
| `npm run fonts` | Re-subset the self-hosted fonts into `src/assets/fonts/` |
| `npm run screenshots` | Re-capture project screenshots (runs `images` afterwards) |
| `npm run images` | Derive the responsive screenshot sizes |

If the artwork's layout ever changes, adjust `TRIM` / `TAG` / `SPLIT` in `scripts/build-logo.mjs`; the script prints the matching CSS percentages for `.brand__layer--*`.
