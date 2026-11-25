/**
 * English texts of saucedemo and its API (dummyjson), exactly as they are shown or returned.
 *
 * This is the source locale: it defines the message keys, and every other
 * locale must provide the same keys (enforced by the `Messages` type).
 * Placeholders use `{name}` and are filled with `formatMessage()`.
 */
export const en = {
  login: {
    errors: {
      lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
      invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
      usernameRequired: 'Epic sadface: Username is required',
      passwordRequired: 'Epic sadface: Password is required',
      /** Shown when a signed-out user opens a protected page. */
      protectedRoute: "Epic sadface: You can only access '{path}' when you are logged in.",
    },
  },
  inventory: {
    sortOptions: {
      nameAToZ: 'Name (A to Z)',
      nameZToA: 'Name (Z to A)',
      priceLowToHigh: 'Price (low to high)',
      priceHighToLow: 'Price (high to low)',
    },
  },
  product: {
    addToCartButton: 'Add to cart',
    removeButton: 'Remove',
  },
  checkout: {
    informationTitle: 'Checkout: Your Information',
    overviewTitle: 'Checkout: Overview',
    completeTitle: 'Checkout: Complete!',
    completeHeader: 'Thank you for your order!',
    completeText: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  },
  api: {
    errors: {
      invalidCredentials: 'Invalid credentials',
      productNotFound: "Product with id '{id}' not found",
    },
  },
} as const;
