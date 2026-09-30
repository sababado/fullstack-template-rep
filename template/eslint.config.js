// One flat config for every TypeScript workspace. The backend (Python) is
// linted by ruff; see apps/backend/pyproject.toml.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/storybook-static/**',
    '**/.aws-sam/**',
    'apps/backend/**',
    'apps/frontend/src/core/api/schema.d.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Read configuration through apps/frontend/src/core/config/env.ts so every
      // variable is typed and validated in one place.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.meta.name='import'][property.name='env']",
          message: 'Import config from core/config/env instead of reading import.meta.env.',
        },
      ],
    },
  },
  {
    files: ['apps/frontend/src/core/config/env.ts', '**/*.config.ts', '**/.storybook/**'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.{test,spec,stories}.{ts,tsx}', '**/test/**', '**/testing/**'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs}', '**/*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  storybook.configs['flat/recommended'],
]);
