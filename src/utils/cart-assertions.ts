import { expect } from '@playwright/test';
import type { Header } from '@components/header';
import type { ProductList } from '@components/product-list';
import { idsOf, sortIds, type Product } from '@models/product';
import { CART_KEY, type BrowserState } from './browser-state';

/** A page that lists cart products and shows the header: cart and checkout overview. */
export interface CartView {
  readonly products: ProductList;
  readonly header: Header;
}

/** What a cart view shows on screen, plus what the app keeps in localStorage. */
export interface CartState {
  readonly shown: Product[];
  readonly quantities: number[];
  readonly badgeCount: number;
  readonly storedIds: number[];
}

/**
 * Soft-checks a cart view against the expected products, on two layers:
 *  - UI: same products with the same title and price, quantity 1 each, cart badge count
 *  - localStorage: `cart-contents` holds exactly the expected product ids
 * Returns what was read, for callers that check more (e.g. checkout totals).
 */
export async function verifyCartState(
  view: CartView,
  browserState: BrowserState,
  expected: readonly Product[],
  where: string,
): Promise<CartState> {
  // Let the list finish rendering before reading it once.
  await expect.soft(view.products.items, `number of products on ${where}`).toHaveCount(expected.length);

  const [shown, quantities, badgeCount, storedIds] = await Promise.all([
    view.products.read(),
    view.products.readQuantities(),
    view.header.getCartCount(),
    browserState.getCartItemIds(),
  ]);

  expect.soft(idsOf(shown), `products on ${where}`).toEqual(idsOf(expected));
  for (const product of expected) {
    const match = shown.find((p) => p.id === product.id);
    if (!match) continue; // already reported by the ids check
    expect.soft(match.title, `title of #${product.id} on ${where}`).toBe(product.title);
    expect.soft(match.price, `price of "${product.title}" on ${where}`).toBe(product.price);
  }
  expect.soft(quantities, `quantity per item on ${where}`).toEqual(shown.map(() => 1));
  expect.soft(badgeCount, `cart badge count on ${where}`).toBe(expected.length);
  expect.soft(sortIds(storedIds), `localStorage ${CART_KEY}`).toEqual(idsOf(expected));

  return { shown, quantities, badgeCount, storedIds };
}
