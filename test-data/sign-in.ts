import type { Messages } from './i18n';
import { allUsers, blockedUsers, invalidCredentials, users, type Credentials, type User } from './users';

/** Keys of the login errors shown as-is, without placeholders. */
export type LoginErrorKey = Exclude<keyof Messages['login']['errors'], 'protectedRoute'>;

export interface FailedSignInCase {
  readonly name: string;
  readonly credentials: Credentials;
  /** Key of the error expected on the login page; the text comes from the locale's messages. */
  readonly error: LoginErrorKey;
}

/** Error each blocked account gets when it signs in with the right password. */
const blockedUserErrors: Record<string, LoginErrorKey> = {
  [users.lockedOut.username]: 'lockedOut',
};

function blockedUserError(user: User): LoginErrorKey {
  const error = blockedUserErrors[user.username];
  if (!error) throw new Error(`Add the expected sign-in error for blocked user "${user.username}"`);
  return error;
}

/** Blocked accounts, with their correct password. */
const blockedUserCases: FailedSignInCase[] = blockedUsers.map((user) => ({
  name: `${user.username} (blocked)`,
  credentials: user,
  error: blockedUserError(user),
}));

/** Every account with a wrong and with an empty password. The password is checked before the lock. */
const badPasswordCases: FailedSignInCase[] = allUsers.flatMap(({ username }) => [
  {
    name: `${username} with wrong password`,
    credentials: { username, password: invalidCredentials.password },
    error: 'invalidCredentials' as const,
  },
  {
    name: `${username} with empty password`,
    credentials: { username, password: '' },
    error: 'passwordRequired' as const,
  },
]);

/** Cases that don't depend on a particular account. */
const credentialCases: FailedSignInCase[] = [
  {
    name: 'unknown username and password',
    credentials: invalidCredentials,
    error: 'invalidCredentials',
  },
  {
    name: 'empty username',
    credentials: { username: '', password: users.standard.password },
    error: 'usernameRequired',
  },
  {
    name: 'empty username and password',
    credentials: { username: '', password: '' },
    error: 'usernameRequired',
  },
];

export const failedSignInCases: FailedSignInCase[] = [...blockedUserCases, ...badPasswordCases, ...credentialCases];
