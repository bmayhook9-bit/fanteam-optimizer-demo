import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'main.js',
        assetFileNames: '[name][extname]'
      }
    }
  }
});
