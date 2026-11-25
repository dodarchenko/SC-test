import { test as base } from '@playwright/test';
import { messagesFor, type Messages } from '@data/i18n';

/** Fixtures shared by the UI and API tests. */
export interface BaseFixtures {
  /** Expected texts for the test's `locale` (playwright.config.ts, or per test with test.use). */
  messages: Messages;
}

export const test = base.extend<BaseFixtures>({
  messages: async ({ locale }, use) => {
    if (!locale) throw new Error('`locale` must be set in playwright.config.ts');
    await use(messagesFor(locale));
  },
});
