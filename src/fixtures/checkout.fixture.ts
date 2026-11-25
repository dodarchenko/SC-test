import { expect } from '@playwright/test';
import { TAX_RATE } from '@data/checkout';
import { formatMoney, sumCents, toCents } from '@models/money';
import { formatProduct, type Product } from '@models/product';
import { CheckoutCompletePage } from '@pages/checkout-complete.page';
import { CheckoutInformationPage } from '@pages/checkout-information.page';
import { CheckoutOverviewPage } from '@pages/checkout-overview.page';
import { verifyCartState } from '@utils/cart-assertions';
import { report } from '@utils/report';
import { test as cartTest } from './cart.fixture';
import { pageObject } from './page-object';

export interface CheckoutFixtures {
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  /**
   * Verifies the checkout overview (step two) the browser is on (fails if it doesn't
   * load) against the expected products: titles, prices, quantities, badge,
   * `cart-contents`, plus item total, tax and total. Checks are soft, so one run
   * reports every mismatch.
   */
  verifyCheckoutOverview: (expected: Product[]) => Promise<void>;
}

export const test = cartTest.extend<CheckoutFixtures>({
  checkoutInformationPage: pageObject(CheckoutInformationPage),
  checkoutOverviewPage: pageObject(CheckoutOverviewPage),
  checkoutCompletePage: pageObject(CheckoutCompletePage),

  verifyCheckoutOverview: async ({ checkoutOverviewPage, session }, use) => {
    await use(async (expected) => {
      await test.step(`Verify checkout overview (${expected.length} products)`, async () => {
        await checkoutOverviewPage.waitForLoaded();

        const state = await verifyCartState(checkoutOverviewPage, session, expected, 'checkout overview');
        const summary = await checkoutOverviewPage.readSummary();

        await report({
          type: 'checkout overview',
          summary:
            `${state.shown.map(formatProduct).join(', ')} | item total ${formatMoney(summary.itemTotal)}, ` +
            `tax ${formatMoney(summary.tax)}, total ${formatMoney(summary.total)} | ` +
            `cart-contents ${JSON.stringify(state.storedIds)}`,
          data: { expected, ...state, summary },
        });

        // Totals, compared in cents to avoid float drift.
        const itemTotal = sumCents(expected.map((product) => product.price));
        const tax = Math.round(itemTotal * TAX_RATE);
        expect.soft(toCents(summary.itemTotal), 'item total (cents)').toBe(itemTotal);
        expect.soft(toCents(summary.tax), `tax at ${TAX_RATE * 100}% (cents)`).toBe(tax);
        expect.soft(toCents(summary.total), 'total = item total + tax (cents)').toBe(itemTotal + tax);
      });
    });
  },
});
