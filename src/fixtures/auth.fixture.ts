import { expect } from '@playwright/test';
import type { User } from '@data/users';
import { InventoryPage } from '@pages/inventory.page';
import { LoginPage } from '@pages/login.page';
import { test as base } from '@shared/base.fixture';
import { BrowserState } from '@utils/browser-state';
import { pageObject } from './page-object';

export interface StateSignInOptions {
  /** Product ids to pre-seed in the cart (localStorage `cart-contents`). */
  cartItemIds?: number[];
}

export interface AuthFixtures {
  /** The app's state in the browser: session cookie and stored cart. */
  session: BrowserState;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  /** Signs in through the login form, exactly like a real user. */
  signInViaUI: (user: User) => Promise<void>;
  /** Signs in by writing session state directly into the browser (no form). */
  signInViaState: (user: User, options?: StateSignInOptions) => Promise<void>;
}

function assertCanSignIn(user: User): void {
  if (!user.canSignIn) {
    throw new Error(
      `"${user.username}" is not expected to sign in. Use LoginPage directly for negative sign-in scenarios.`,
    );
  }
}

export const test = base.extend<AuthFixtures>({
  session: async ({ page, baseURL }, use) => {
    if (!baseURL) throw new Error('`baseURL` must be set in playwright.config.ts');
    await use(new BrowserState(page, baseURL));
  },

  loginPage: pageObject(LoginPage),
  inventoryPage: pageObject(InventoryPage),

  signInViaUI: async ({ loginPage, inventoryPage, session }, use) => {
    await use(async (user) => {
      assertCanSignIn(user);

      await test.step(`Sign in via UI as "${user.username}"`, async () => {
        await loginPage.open();
        await loginPage.signIn(user);
        await inventoryPage.waitForLoaded();
        expect(await session.getSessionUsername(), 'session cookie after UI sign in').toBe(user.username);
      });
    });
  },

  signInViaState: async ({ loginPage, inventoryPage, session }, use) => {
    await use(async (user, { cartItemIds } = {}) => {
      assertCanSignIn(user);

      await test.step(`Sign in via state as "${user.username}"`, async () => {
        await session.setSessionUsername(user.username);
        if (cartItemIds?.length) {
          // localStorage is per-origin, so we need to be on the app before writing it.
          await loginPage.navigate();
          await session.setCartItemIds(cartItemIds);
        }
        // Fails if the app doesn't accept the cookie and bounces back to login.
        await inventoryPage.open();
      });
    });
  },
});
