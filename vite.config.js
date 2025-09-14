import { defineConfig } from 'vite';

export default defineConfig({
  root: 'ui',
  build: {
    outDir: '../dist',
    emptyOutDir: false,
  },
  test: {
    root: './',
    include: ['tests/**/*.{test,spec}.js'],
  },
});
