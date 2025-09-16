import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  publicDir: '../static',
  build: {
    outDir: '../dist',
  },
});
