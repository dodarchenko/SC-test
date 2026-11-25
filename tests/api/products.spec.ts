import { test, expect } from '@api/fixtures';
import { expectError, expectResponse } from '@api/response';
import { productSchema } from '@api/schemas/product';
import { formatMessage } from '@data/i18n';

test.describe('Products API', { tag: '@api' }, () => {
  test('returns a product with valid content', async ({ productsApi, catalog }) => {
    const [listed] = await catalog.pickRandom(1);

    // Schema: every field present, typed and in range (price > 0, rating 0–5, discount 0–100, …).
    const product = await expectResponse(await productsApi.get(listed.id), 200, productSchema);

    await test.step('Matches the catalog listing', () => {
      expect(product).toMatchObject(listed);
    });

    await test.step('Content is consistent', () => {
      expect.soft(product.images, 'thumbnail and images are distinct').not.toContain(product.thumbnail);
      expect
        .soft(Date.parse(product.meta.updatedAt), 'updatedAt is not before createdAt')
        .toBeGreaterThanOrEqual(Date.parse(product.meta.createdAt));
      for (const review of product.reviews) {
        expect
          .soft(Date.parse(review.date), `review by ${review.reviewerName} is not in the future`)
          .toBeLessThanOrEqual(Date.now());
      }
    });
  });

  test('returns 404 for a product that does not exist', async ({ productsApi, catalog, messages }) => {
    const unusedId = await catalog.unusedProductId();
    const expected = formatMessage(messages.api.errors.productNotFound, { id: unusedId });

    await expectError(await productsApi.get(unusedId), 404, expected);
  });
});
