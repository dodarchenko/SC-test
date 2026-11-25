import { z } from 'zod';
import { id, isoDate, pageFields, percentage, quantity, url } from './common';

const money = z.number().nonnegative();

const cartLineFields = {
  id,
  title: z.string().min(1),
  price: z.number().positive(),
  quantity,
  /** price × quantity */
  total: money,
  discountPercentage: percentage,
  thumbnail: url,
};

const cartFields = {
  id,
  userId: id,
  /** Sum of line totals. */
  total: money,
  discountedTotal: money,
  totalProducts: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
};

/**
 * POST /carts/add. dummyjson simulates the cart (it isn't stored), and its lines
 * name the discounted amount `discountedPrice`, unlike stored carts (`discountedTotal`).
 */
export const newCartSchema = z.object({
  ...cartFields,
  products: z.array(z.object({ ...cartLineFields, discountedPrice: money })),
});

/** A cart stored on the server, e.g. from GET /carts/user/{userId}. */
const storedCartSchema = z.object({
  ...cartFields,
  products: z.array(z.object({ ...cartLineFields, discountedTotal: money })),
});

/** GET /carts/user/{userId} */
export const userCartsSchema = z.object({ carts: z.array(storedCartSchema), ...pageFields });

/** DELETE /carts/{id}: the deleted cart, flagged. */
export const deletedCartSchema = storedCartSchema.extend({
  isDeleted: z.literal(true),
  deletedOn: isoDate,
});

/** Body of POST /carts/add. */
export const newCartRequestSchema = z.object({
  userId: id,
  products: z.array(z.object({ id, quantity })),
});
export type NewCartRequest = z.infer<typeof newCartRequestSchema>;
