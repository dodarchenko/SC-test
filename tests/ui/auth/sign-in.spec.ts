import { test, expect } from '@fixtures';
import { formatMessage } from '@data/i18n';
import { failedSignInCases } from '@data/sign-in';
import { invalidCredentials } from '@data/users';
import { LoginPage } from '@pages/login.page';

test.describe('Sign in - failed', () => {
  for (const { name, credentials, error } of failedSignInCases) {
    test(
      `is rejected for ${name}`,
      { tag: ['@auth'] },
      async ({ page, messages, loginPage, inventoryPage, session }) => {
        await loginPage.open();
        const storageKeysBefore = await session.getLocalStorageKeys();

        await loginPage.signIn(credentials);

        await test.step('UI: stays on login page with an error', async () => {
          await expect(page).toHaveURL(loginPage.path);
          await expect(loginPage.errorMessage).toHaveText(messages.login.errors[error]);
          await expect(loginPage.loginButton).toBeVisible();
          await expect(inventoryPage.title).toBeHidden();
          for (const input of loginPage.inputs) {
            await expect(input).toHaveClass(LoginPage.invalidInputClass);
          }
          await expect(loginPage.errorIcons).toHaveCount(loginPage.inputs.length);
          // Entered values are kept so the user can correct them.
          await expect(loginPage.usernameInput).toHaveValue(credentials.username);
          await expect(loginPage.passwordInput).toHaveValue(credentials.password);
        });

        await test.step('Browser state: no session or cart created', async () => {
          expect(await session.hasStoredCart(), 'cart stored in localStorage').toBe(false);
          expect(await session.getLocalStorageKeys(), 'localStorage keys unchanged').toEqual(storageKeysBefore);
          // Soft, so the remaining checks still run. locked_out_user currently fails
          // here: the site sets the session cookie even though sign in is refused.
          expect.soft(await session.getSessionUsername(), 'session cookie after failed sign in').toBeUndefined();
        });

        await test.step('Session is not usable on a protected page', async () => {
          await inventoryPage.navigate();
          await expect(page).toHaveURL(loginPage.path);
          await expect(loginPage.errorMessage).toHaveText(
            formatMessage(messages.login.errors.protectedRoute, { path: inventoryPage.path }),
          );
          expect(await session.hasStoredCart(), 'cart stored in localStorage').toBe(false);
        });
      },
    );
  }

  test('error can be dismissed', { tag: ['@auth'] }, async ({ messages, loginPage }) => {
    await loginPage.open();
    await loginPage.signIn(invalidCredentials);
    await expect(loginPage.errorMessage).toHaveText(messages.login.errors.invalidCredentials);

    await loginPage.dismissError();

    await expect(loginPage.errorMessage).toBeHidden();
    await expect(loginPage.errorIcons).toHaveCount(0);
    for (const input of loginPage.inputs) {
      await expect(input).not.toHaveClass(LoginPage.invalidInputClass);
    }
  });
});
