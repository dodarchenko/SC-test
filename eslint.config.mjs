// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // no-floating-promises (from recommendedTypeChecked) already catches a missing await.
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    files: ['tests/**/*.ts', 'src/fixtures/**/*.ts', 'src/api/**/*.ts', 'src/shared/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Fixtures and helpers such as verifyCart() hold the assertions for many tests.
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'verifyCart',
            'verifyCheckoutOverview',
            'expectEmptyCart',
            'signInViaUI',
            'expectError',
            'expectResponse',
          ],
        },
      ],
      // Expected failures are deliberate and documented in test data (User.knownIssue).
      'playwright/no-conditional-in-test': 'off',
    },
  },
  { files: ['eslint.config.mjs'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
