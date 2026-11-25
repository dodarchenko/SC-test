import type { BrowserContext, Page } from '@playwright/test';

/**
 * saucedemo is a client-only app with no API, so its state lives in the browser:
 *  - cookie `session-username`  → who is signed in (10 min TTL, set by the login form)
 *  - localStorage `cart-contents` → JSON array of product ids in the cart
 *
 * This class is the single place that knows those keys, for both reading
 * (state validation) and writing (state-based sign in).
 */
export const CART_KEY = 'cart-contents';
const SESSION_COOKIE = 'session-username';
/** Matches the site's own cookie lifetime. */
const SESSION_TTL_SECONDS = 10 * 60;

export class BrowserState {
  constructor(
    private readonly page: Page,
    private readonly baseURL: string,
  ) {}

  private get context(): BrowserContext {
    return this.page.context();
  }

  /** Username stored in the session cookie, or `undefined` when signed out. */
  async getSessionUsername(): Promise<string | undefined> {
    const cookies = await this.context.cookies(this.baseURL);
    return cookies.find((c) => c.name === SESSION_COOKIE)?.value;
  }

  async setSessionUsername(username: string): Promise<void> {
    const { hostname } = new URL(this.baseURL);
    await this.context.addCookies([
      {
        name: SESSION_COOKIE,
        value: username,
        domain: hostname,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        sameSite: 'Lax',
      },
    ]);
  }

  /** All localStorage keys, sorted. Requires the page to be on the app origin. */
  async getLocalStorageKeys(): Promise<string[]> {
    const keys = await this.page.evaluate(() => Object.keys(window.localStorage));
    return keys.sort();
  }

  /** Whether the app has written a cart to localStorage at all (even an empty one). */
  async hasStoredCart(): Promise<boolean> {
    return (await this.readCartRaw()) !== null;
  }

  /** Product ids currently in the cart (empty when no cart is stored). */
  async getCartItemIds(): Promise<number[]> {
    const raw = await this.readCartRaw();
    return raw ? (JSON.parse(raw) as number[]) : [];
  }

  async setCartItemIds(ids: readonly number[]): Promise<void> {
    await this.page.evaluate(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CART_KEY, JSON.stringify(ids)],
    );
  }

  private async readCartRaw(): Promise<string | null> {
    return this.page.evaluate((key) => window.localStorage.getItem(key), CART_KEY);
  }
}
