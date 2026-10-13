import { defineConfig } from 'vite';
import path from 'node:path';

// Two pages are built: the home page and each case study (case-studies/<name>/index.html).
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve('index.html'),
        briks: path.resolve('case-studies/briks/index.html'),
      },
    },
  },
});
