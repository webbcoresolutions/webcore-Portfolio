import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/** Social crawlers need absolute image URLs: set VITE_SITE_URL (e.g. https://portfolio.webcoreuae.com). */
function siteUrl(url: string): Plugin {
  const base = url.replace(/\/+$/, '');
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', base),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), siteUrl(env.VITE_SITE_URL || '')],
    // The build-time pre-renderer bundles everything so it runs in plain Node.
    ssr: { noExternal: true },
    build: {
      target: 'es2020',
      // three.js is only loaded lazily (hero scene / contact globe).
      chunkSizeWarningLimit: 700,
      // All CSS is global and inlined into each page at build time, so lazy chunks
      // (3D scenes) must not re-request the stylesheet.
      modulePreload: {
        resolveDependencies: (_file: string, deps: string[]) => deps.filter((d) => !d.endsWith('.css')),
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          contact: resolve(__dirname, 'contact/index.html'),
        },
      },
    },
  };
});
