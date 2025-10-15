module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    es2021: true,
    serviceworker: true
  },
  ignorePatterns: ['node_modules/'],
  plugins: ['@typescript-eslint'],
  rules: {}
};
