import { report } from '@utils/report';
import type { ProductsClient } from './clients';
import { expectResponse } from './response';
import { catalogFields, catalogPageSchema, type CatalogProduct } from './schemas/product';

/**
 * The live product catalog, so tests pick real products instead of hardcoded ids.
 * Loaded once per test, on first use.
 */
export class Catalog {
  private page?: Promise<{ products: CatalogProduct[] }>;

  constructor(private readonly products: ProductsClient) {}

  private load() {
    this.page ??= this.products
      .list({ limit: 0, select: catalogFields })
      .then((response) => expectResponse(response, 200, catalogPageSchema));
    return this.page;
  }

  /** `count` different products, chosen at random. The picks are recorded in the report. */
  async pickRandom(count: number): Promise<CatalogProduct[]> {
    const { products } = await this.load();
    if (products.length < count) throw new Error(`Catalog has ${products.length} products, need ${count}`);
    const pool = [...products];
    const picked = Array.from({ length: count }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    await report({
      type: 'picked products',
      summary: picked.map((product) => `#${product.id} "${product.title}"`).join(', '),
      data: picked,
    });
    return picked;
  }

  /** An id no product has: one past the highest id in the catalog. */
  async unusedProductId(): Promise<number> {
    const { products } = await this.load();
    return Math.max(...products.map((product) => product.id)) + 1;
  }
}
