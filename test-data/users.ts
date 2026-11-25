import { requireEnv } from '@shared/env';

/**
 * Test users.
 *
 * Passwords are never kept in the repository: they come from the environment
 * (.env locally, CI secrets). saucedemo accounts share one password (SAUCE_PASSWORD);
 * the API account (dummyjson) has its own (API_USERNAME / API_PASSWORD).
 */
const PASSWORD = requireEnv('SAUCE_PASSWORD');

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

export interface User extends Credentials {
  /** Whether the account is expected to sign in successfully. */
  readonly canSignIn: boolean;
  /**
   * Defect the site deliberately builds into this account, which breaks the
   * purchase flow. Specs use it to mark the flow as an expected failure.
   */
  readonly knownIssue?: string;
}

function user(username: string, options: Partial<Omit<User, 'username'>> = {}): User {
  return { username, password: PASSWORD, canSignIn: true, ...options };
}

/** saucedemo accounts, used by the UI tests. */
export const users = {
  standard: user('standard_user'),
  lockedOut: user('locked_out_user', { canSignIn: false }),
  problem: user('problem_user', {
    knownIssue: '"Add to cart" does nothing for some products; checkout form rejects valid customer data',
  }),
  performanceGlitch: user('performance_glitch_user'),
  error: user('error_user', {
    knownIssue: '"Add to cart" does nothing for some products; "Finish" does not complete the order',
  }),
  visual: user('visual_user', { knownIssue: 'Inventory shows wrong prices that differ from cart and checkout' }),
} satisfies Record<string, User>;

/** Every saucedemo test account. */
export const allUsers: User[] = Object.values(users);

/** saucedemo accounts that can successfully sign in. */
export const signInUsers: User[] = allUsers.filter((u) => u.canSignIn);

/** saucedemo accounts the site refuses to sign in even with the right password. */
export const blockedUsers: User[] = allUsers.filter((u) => !u.canSignIn);

/**
 * Account for the API tests. dummyjson (the backend stand-in) only accepts its own
 * users, not saucedemo's; set API_USERNAME / API_PASSWORD to any of them.
 */
export const apiUser: User = user(requireEnv('API_USERNAME'), { password: requireEnv('API_PASSWORD') });

/** Lifetime requested for API access tokens; short, since tests use them right away. */
export const tokenLifetimeMinutes = 5;

/** Credentials that don't exist on the site, for negative scenarios. */
export const invalidCredentials: Credentials = { username: 'unknown_user', password: 'wrong_password' };
