/** ESLint v8 config (classic) */
module.exports = {
  root: true,
  env: { node: true, es2020: true, browser: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  settings: { react: { version: 'detect' } },
  overrides: [
    { files: ['**/*.tsx', '**/*.ts'], parser: '@typescript-eslint/parser' },
    { files: ['tests/**/*.{ts,tsx}'], env: { node: true, browser: true } },
  ],
  ignorePatterns: ['dist/', 'public/', 'ui/', 'server/models/User.js', '**/*.d.ts'],
  rules: { 'prettier/prettier': 'error' },
};
