import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { envOrLocalDefault, loadEnvFile } from './src/shared/env';

/* URLs of hosted systems come from the environment (.env locally, CI variables), never from the repo.
   Locally, unset URLs fall back to local dev servers; on CI they are required. */
loadEnvFile();

/** Settings for the saucedemo UI tests (tests/ui), shared by every browser project. */
const ui: PlaywrightTestConfig['use'] = {
  baseURL: envOrLocalDefault('BASE_URL', 'http://localhost:3000'),
  /* saucedemo marks elements with data-test, so getByTestId() maps to it. */
  testIdAttribute: 'data-test',
  /* A stuck step fails on its own, with a clear error, instead of hitting the test timeout.
     Navigation allows for performance_glitch_user's ~5 s sign in. */
  actionTimeout: 10_000,
  navigationTimeout: 15_000,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
};

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  fullyParallel: true,
  /* Fail the build on CI if test.only was left in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* Some tests fail by design (known site defects), so never auto-open the report; use `npm run report`.
     On CI, the github reporter also shows failures as annotations on the run and pull request. */
  reporter: [...(process.env.CI ? [['github'] as const] : []), ['list'], ['html', { open: 'never' }]],
  use: {
    /* Browser locale (UI); also picks the expected texts for UI and API tests (see test-data/i18n). */
    locale: process.env.LOCALE ?? 'en-US',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'], ...ui } },
    { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'], ...ui } },
    {
      /* dummyjson REST API tests (tests/api); no browser is started. */
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: envOrLocalDefault('API_BASE_URL', 'http://localhost:8888'),
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
