import { z } from 'zod';

export const id = z.number().int().positive();
export const quantity = z.number().int().positive();
export const percentage = z.number().min(0).max(100);
export const url = z.string().url();
export const isoDate = z.string().datetime();
/** Three base64url segments: header.payload.signature. */
export const jwt = z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'expected a JWT');

/** Body of every dummyjson error response. Strict, so an error can't carry data (e.g. a token). */
export const errorSchema = z.object({ message: z.string().min(1) }).strict();

/** Envelope of paginated list responses. */
export const pageFields = {
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
};
