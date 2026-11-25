import type { APIRequestContext } from '@playwright/test';
import { apiUser } from '@data/users';
import { test as base } from '@shared/base.fixture';
import { Catalog } from './catalog';
import { AuthClient, CartsClient, ProductsClient, type ApiClient } from './clients';
import type { LoginResponse } from './schemas/auth';

/** API fixtures, on top of the shared ones (`messages`; API errors are under `messages.api.errors`). */
export interface ApiFixtures {
  authApi: AuthClient;
  productsApi: ProductsClient;
  cartsApi: CartsClient;
  /** Live product catalog, for picking real products and unused ids. */
  catalog: Catalog;
  /** Logs in as `apiUser` (test-data/users.ts) and returns the validated session. */
  loggedInUser: LoginResponse;
}

/** Fixture that creates an API client on the test's request context: `authApi: apiClient(AuthClient)`. */
function apiClient<T extends ApiClient>(Client: new (request: APIRequestContext) => T) {
  return async ({ request }: { request: APIRequestContext }, use: (client: T) => Promise<void>): Promise<void> => {
    await use(new Client(request));
  };
}

export const test = base.extend<ApiFixtures>({
  authApi: apiClient(AuthClient),
  productsApi: apiClient(ProductsClient),
  cartsApi: apiClient(CartsClient),

  catalog: async ({ productsApi }, use) => {
    await use(new Catalog(productsApi));
  },

  loggedInUser: async ({ authApi }, use) => {
    await use(await authApi.loginAs(apiUser));
  },
});

export { expect } from '@playwright/test';
