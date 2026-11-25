import { test, expect } from '@fixtures';
import { customers } from '@data/checkout';
import { signInUsers, users } from '@data/users';

test.describe('Checkout', { tag: '@e2e' }, () => {
  for (const user of signInUsers) {
    // Smoke runs cover the happy path only, not the accounts with deliberate defects.
    // eslint-disable-next-line playwright/valid-test-tags -- the rule only accepts literal tags
    test(
      `${user.username} buys two products end to end`,
      { tag: user === users.standard ? ['@smoke'] : [] },
      async ({
        messages,
        session,
        signInViaUI,
        addRandomProductToCart,
        verifyCart,
        verifyCheckoutOverview,
        expectEmptyCart,
        inventoryPage,
        cartPage,
        checkoutInformationPage,
        checkoutOverviewPage,
        checkoutCompletePage,
      }) => {
        // Accounts with a deliberate site defect must fail; if one starts passing,
        // Playwright reports it so the known issue can be revisited.
        test.fail(!!user.knownIssue, user.knownIssue);

        await signInViaUI(user);
        await expectEmptyCart(inventoryPage);

        const added = [await addRandomProductToCart(), await addRandomProductToCart()];

        await inventoryPage.header.cartLink.click();
        await verifyCart(added);

        await test.step('Fill in customer information', async () => {
          await cartPage.checkoutButton.click();
          await checkoutInformationPage.waitForLoaded();
          await expect(checkoutInformationPage.title).toHaveText(messages.checkout.informationTitle);

          await checkoutInformationPage.submit(customers.default);
          await expect(checkoutInformationPage.errorMessage).toBeHidden();
        });

        await verifyCheckoutOverview(added);
        await expect(checkoutOverviewPage.title).toHaveText(messages.checkout.overviewTitle);

        await test.step('Finish the order', async () => {
          await checkoutOverviewPage.finishButton.click();
          await checkoutCompletePage.waitForLoaded();

          await expect(checkoutCompletePage.title).toHaveText(messages.checkout.completeTitle);
          await expect(checkoutCompletePage.completeHeader).toHaveText(messages.checkout.completeHeader);
          await expect(checkoutCompletePage.completeText).toHaveText(messages.checkout.completeText);
          await expectEmptyCart(checkoutCompletePage);
          // The app removes the stored cart entirely, rather than leaving an empty one.
          expect(await session.hasStoredCart(), 'cart stored in localStorage').toBe(false);
          expect(await session.getSessionUsername(), 'session cookie survives the order').toBe(user.username);
        });

        await test.step('Back home', async () => {
          await checkoutCompletePage.backHomeButton.click();
          await inventoryPage.waitForLoaded();
          await expectEmptyCart(inventoryPage);
        });
      },
    );
  }
});
