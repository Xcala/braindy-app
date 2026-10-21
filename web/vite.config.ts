import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Release id for error reports: the CI commit when there is one, else the build time.
process.env.VITE_RELEASE ??= process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString().slice(0, 16);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
