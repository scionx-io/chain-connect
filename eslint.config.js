import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.min.js',
      '*.umd.js',
      '*.es.js',
    ],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    files: ['src/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        beforeEach: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  },
];
