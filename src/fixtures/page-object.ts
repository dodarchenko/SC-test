import type { Page } from '@playwright/test';

/** Fixture that creates a page object for the test's page: `loginPage: pageObject(LoginPage)`. */
export function pageObject<T>(PageObject: new (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (pageObject: T) => Promise<void>): Promise<void> => {
    await use(new PageObject(page));
  };
}
