import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

// Dev only: the static pages in public/ (audit, faq, privacy) answer at /name/ like they do on the live site,
// instead of falling back to the home page.
const publicFolders = {
  name: 'public-folder-index',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = (req.url || '').split('?')[0];
      if (/^\/[\w-]+\/?$/.test(url)) {
        const dir = url.replace(/\/$/, '');
        if (fs.existsSync(path.resolve('public' + dir + '/index.html'))) req.url = dir + '/index.html';
      }
      next();
    });
  },
};

// Two pages are built: the home page and each case study (case-studies/<name>/index.html).
export default defineConfig({
  base: './',
  plugins: [publicFolders],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve('index.html'),
        briks: path.resolve('case-studies/briks/index.html'),
      },
    },
  },
});
