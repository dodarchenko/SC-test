import { test, expect } from '@api/fixtures';
import { expectResponse } from '@api/response';
import { deletedCartSchema, newCartSchema, userCartsSchema, type NewCartRequest } from '@api/schemas/cart';
import { deletedOnToleranceMs, newCart } from '@data/carts';
import { sumCents, toCents } from '@models/money';

const randomQuantity = () =>
  newCart.minQuantity + Math.floor(Math.random() * (newCart.maxQuantity - newCart.minQuantity + 1));

test.describe('Carts API', { tag: '@api' }, () => {
  test(`creates a cart with ${newCart.productCount} products for the logged-in user`, async ({
    loggedInUser,
    catalog,
    cartsApi,
  }) => {
    const picked = await catalog.pickRandom(newCart.productCount);
    const request: NewCartRequest = {
      userId: loggedInUser.id,
      products: picked.map((product) => ({ id: product.id, quantity: randomQuantity() })),
    };

    const cart = await expectResponse(await cartsApi.create(request), 201, newCartSchema);

    await test.step('Belongs to the logged-in user and holds the requested products', () => {
      expect(cart.userId, 'userId').toBe(loggedInUser.id);
      expect(cart.totalProducts, 'totalProducts').toBe(newCart.productCount);
      expect(
        cart.products.map(({ id, quantity }) => ({ id, quantity })),
        'products and quantities',
      ).toEqual(request.products);
    });

    // Money is compared in cents: the API returns raw float sums such as 209.96999999999997.
    await test.step('Lines match the catalog and their own totals', () => {
      for (const line of cart.products) {
        const product = picked.find((p) => p.id === line.id);
        expect.soft(line, `line #${line.id}`).toMatchObject({
          title: product?.title,
          price: product?.price,
          discountPercentage: product?.discountPercentage,
        });
        expect
          .soft(toCents(line.total), `line #${line.id} total = price × quantity`)
          .toBe(toCents(line.price) * line.quantity);
      }
    });

    await test.step('Cart totals add up', () => {
      const totalQuantity = request.products.reduce((total, product) => total + product.quantity, 0);
      expect.soft(cart.totalQuantity, 'totalQuantity').toBe(totalQuantity);
      expect
        .soft(toCents(cart.total), 'total = sum of line totals')
        .toBe(sumCents(cart.products.map((line) => line.total)));
      expect
        .soft(toCents(cart.discountedTotal), 'discountedTotal = sum of discounted lines')
        .toBe(sumCents(cart.products.map((line) => line.discountedPrice)));
      expect.soft(cart.discountedTotal, 'discountedTotal is not above total').toBeLessThanOrEqual(cart.total);
    });
  });

  test("deletes one of the logged-in user's carts", async ({ loggedInUser, cartsApi }) => {
    const { carts } = await expectResponse(await cartsApi.listForUser(loggedInUser.id), 200, userCartsSchema);
    expect(carts.length, `carts of user #${loggedInUser.id}`).toBeGreaterThan(0);
    const [cart] = carts;

    const deleted = await expectResponse(await cartsApi.delete(cart.id), 200, deletedCartSchema);

    // dummyjson simulates the delete: it returns the cart flagged as deleted, without removing it.
    expect(deleted, 'deleted cart is the requested one, unchanged').toMatchObject(cart);
    expect(deleted.isDeleted).toBe(true);
    expect(
      Math.abs(Date.parse(deleted.deletedOn) - Date.now()),
      `deletedOn (${deleted.deletedOn}) is close to now`,
    ).toBeLessThan(deletedOnToleranceMs);
  });
});
