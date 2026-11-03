import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const api = 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@shared': path.resolve(here, '../shared'), '@': path.resolve(here, 'src') } },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': api, '/img': api, '/uploads': api, '/robots.txt': api, '/sitemap.xml': api },
  },
});
