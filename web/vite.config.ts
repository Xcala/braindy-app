import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Release id for error reports: the CI commit when there is one, else the build time.
process.env.VITE_RELEASE ??= process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString().slice(0, 16);

/**
 * Emits /sw.js (template in pwa/sw.js) with this build's app shell: the page, the manifest, the icons,
 * every script and stylesheet, and the Latin woff2 fonts. Other font subsets load on demand.
 */
function serviceWorker(): Plugin {
  return {
    name: 'braindy-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => /\.(js|css)$/.test(f) || /-latin-\d+-normal-[^.]+\.woff2$/.test(f));
      const shell = ['/index.html', '/site.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg', ...files.map((f) => `/${f}`)];
      const version = createHash('sha256').update(files.sort().join('|')).digest('hex').slice(0, 12);
      const source = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(shell));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  server: { port: 5173 },
});
