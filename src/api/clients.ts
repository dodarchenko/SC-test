import { test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { tokenLifetimeMinutes, type Credentials } from '@data/users';
import { expectResponse } from './response';
import { loginResponseSchema, type LoginResponse } from './schemas/auth';
import { newCartRequestSchema, type NewCartRequest } from './schemas/cart';

type RequestOptions = NonNullable<Parameters<APIRequestContext['fetch']>[1]>;

/**
 * Thin wrappers around dummyjson endpoints. They send requests and return the raw
 * response, so tests decide which status and body to expect (see expectResponse).
 * Paths are relative to the `api` project's baseURL.
 */
export abstract class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  /** Sends a request as a report step named after it, e.g. "GET /products/42". */
  protected send(method: 'GET' | 'POST' | 'DELETE', path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return test.step(`${method} ${path}`, () => this.request.fetch(path, { ...options, method }), { box: true });
  }
}

export class AuthClient extends ApiClient {
  login(credentials: Credentials, expiresInMins = tokenLifetimeMinutes): Promise<APIResponse> {
    return this.send('POST', '/auth/login', { data: { ...credentials, expiresInMins } });
  }

  /** Logs in and returns the validated session; for tests that need a signed-in user, not the login itself. */
  async loginAs(credentials: Credentials): Promise<LoginResponse> {
    return expectResponse(await this.login(credentials), 200, loginResponseSchema);
  }

  /** The user the access token belongs to. */
  me(accessToken: string): Promise<APIResponse> {
    return this.send('GET', '/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  }
}

export class ProductsClient extends ApiClient {
  /** A page of products; `limit: 0` returns all, `select` limits the fields. */
  list(params: { limit?: number; select?: readonly string[] } = {}): Promise<APIResponse> {
    const { select, ...paging } = params;
    return this.send('GET', '/products', { params: { ...paging, ...(select && { select: select.join(',') }) } });
  }

  get(productId: number): Promise<APIResponse> {
    return this.send('GET', `/products/${productId}`);
  }
}

export class CartsClient extends ApiClient {
  /** Validates the body first, so broken test data fails clearly instead of as a confusing API error. */
  create(cart: NewCartRequest): Promise<APIResponse> {
    return this.send('POST', '/carts/add', { data: newCartRequestSchema.parse(cart) });
  }

  listForUser(userId: number): Promise<APIResponse> {
    return this.send('GET', `/carts/user/${userId}`);
  }

  delete(cartId: number): Promise<APIResponse> {
    return this.send('DELETE', `/carts/${cartId}`);
  }
}
