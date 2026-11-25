import { expect } from '@playwright/test';
import { formatProduct, type Product } from '@models/product';
import { CartPage } from '@pages/cart.page';
import { CART_KEY } from '@utils/browser-state';
import { verifyCartState, type CartView } from '@utils/cart-assertions';
import { report } from '@utils/report';
import { test as authTest } from './auth.fixture';
import { pageObject } from './page-object';

export interface CartFixtures {
  cartPage: CartPage;
  /**
   * Adds a random product that isn't in the cart yet, from the inventory page
   * (opened if needed). Requires a signed-in session. Returns the product as the
   * inventory showed it, so it can be compared with later pages.
   */
  addRandomProductToCart: () => Promise<Product>;
  /**
   * Verifies the cart page the browser is on (fails if it doesn't load) against
   * the expected products: titles, prices, quantities, badge and `cart-contents`.
   * Checks are soft.
   */
  verifyCart: (expected: Product[]) => Promise<void>;
  /** Checks that the cart is empty, both on screen (no badge) and in `cart-contents`. */
  expectEmptyCart: (view: Pick<CartView, 'header'>) => Promise<void>;
}

export const test = authTest.extend<CartFixtures>({
  cartPage: pageObject(CartPage),

  addRandomProductToCart: async ({ inventoryPage, session, messages }, use) => {
    await use(async () => {
      return test.step('Add random product to cart', async () => {
        await inventoryPage.ensureOpen();

        const available = [];
        for (const card of await inventoryPage.products.cards()) {
          if (!(await card.isInCart())) available.push(card);
        }
        if (available.length === 0) throw new Error('Every product is already in the cart');

        const card = available[Math.floor(Math.random() * available.length)];
        const product = await card.read();
        const countBefore = await inventoryPage.header.getCartCount();
        await report({ type: 'product added to cart', summary: formatProduct(product), data: product });

        await card.actionButton.click();

        await expect(card.actionButton, `button of ${formatProduct(product)}`).toHaveText(
          messages.product.removeButton,
        );
        await expect(inventoryPage.header.cartBadge).toHaveText(String(countBefore + 1));
        expect(await session.getCartItemIds(), `localStorage ${CART_KEY}`).toContain(product.id);

        return product;
      });
    });
  },

  verifyCart: async ({ cartPage, session }, use) => {
    await use(async (expected) => {
      await test.step(`Verify cart (${expected.length} products)`, async () => {
        await cartPage.waitForLoaded();
        await verifyCartState(cartPage, session, expected, 'cart page');
      });
    });
  },

  expectEmptyCart: async ({ session }, use) => {
    await use(async (view) => {
      await test.step('Cart is empty', async () => {
        await expect(view.header.cartBadge, 'cart badge').toBeHidden();
        expect(await session.getCartItemIds(), `localStorage ${CART_KEY}`).toEqual([]);
      });
    });
  },
});
