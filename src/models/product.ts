import { formatMoney } from './money';

export interface Product {
  /** Numeric product id, the same value stored in localStorage `cart-contents`. */
  readonly id: number;
  readonly title: string;
  /** Price in dollars, parsed from the "$29.99" label. */
  readonly price: number;
}

export function formatProduct({ id, title, price }: Product): string {
  return `#${id} "${title}" ${formatMoney(price)}`;
}

/** Ascending copy of the ids, for order-independent comparisons. */
export function sortIds(ids: readonly number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

/** Sorted ids of the given products. */
export function idsOf(products: readonly Pick<Product, 'id'>[]): number[] {
  return sortIds(products.map((product) => product.id));
}
