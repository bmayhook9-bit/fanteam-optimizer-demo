import { resolve } from 'path';

export default {
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'public/index.html')
    }
  }
};
