import { test, expect } from '@api/fixtures';
import { expectError, expectResponse } from '@api/response';
import { currentUserSchema, loginResponseSchema } from '@api/schemas/auth';
import { apiUser, invalidCredentials } from '@data/users';

test.describe('Auth API', { tag: '@api' }, () => {
  test('logs in with valid credentials', async ({ authApi }) => {
    const session = await expectResponse(await authApi.login(apiUser), 200, loginResponseSchema);
    expect(session.username, 'logged-in username').toBe(apiUser.username);
    expect(session.accessToken, 'access and refresh tokens differ').not.toBe(session.refreshToken);

    // The token works: /auth/me returns the same user.
    const user = await expectResponse(await authApi.me(session.accessToken), 200, currentUserSchema);
    expect(user).toEqual(currentUserSchema.parse(session));
  });

  test('rejects a wrong password', async ({ authApi, messages }) => {
    const wrongPassword = { username: apiUser.username, password: invalidCredentials.password };

    await expectError(await authApi.login(wrongPassword), 400, messages.api.errors.invalidCredentials);
  });
});
