import { defineConfig } from 'vite';

export default defineConfig({
  root: 'ui',
  build: {
    outDir: '../dist',
    emptyOutDir: false,
  },
  envDir: '../',
  test: {
    root: './',
    include: ['tests/**/*.{test,spec}.js'],
  },
});
