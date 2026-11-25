/** Shape of the cart the API tests create: how many different products, and quantity range per product. */
export const newCart = {
  productCount: 3,
  minQuantity: 1,
  maxQuantity: 5,
} as const;

/** How far a deleted cart's `deletedOn` may be from the test's clock, allowing for clock skew between machines. */
export const deletedOnToleranceMs = 5 * 60 * 1000;
