/** Sales tax saucedemo applies to the item total on the checkout overview. */
export const TAX_RATE = 0.08;

/**
 * Using separate Customer instead of expanding User interface, to support more flexibility
 * assuming signed in user can order for different names and addresses.
 */
export interface Customer {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

export const customers = {
  default: { firstName: 'Jane', lastName: 'Doe', postalCode: '1011 AB' },
} as const satisfies Record<string, Customer>;
