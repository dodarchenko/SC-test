import { z } from 'zod';
import { id, jwt, url } from './common';

const userIdentity = {
  id,
  username: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
};

/** POST /auth/login */
export const loginResponseSchema = z.object({
  ...userIdentity,
  gender: z.string().min(1),
  image: url,
  accessToken: jwt,
  refreshToken: jwt,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * GET /auth/me. The full profile is large; only the identity fields are checked.
 * Parsing a login response with it also extracts the same fields, for comparison.
 */
export const currentUserSchema = z.object(userIdentity);
