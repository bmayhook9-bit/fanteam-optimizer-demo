const { resolve } = require('path');

module.exports = {
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'public/index.html')
    }
  }
};
