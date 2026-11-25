import type { Locator, Page } from '@playwright/test';
import type { Product } from '@models/product';
import { ProductCard } from './product-card';

/**
 * The list of product rows. Inventory, cart and checkout overview render it
 * with the same markup, so all three pages share this component.
 */
export class ProductList {
  readonly items: Locator;
  readonly itemTitles: Locator;

  constructor(page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.itemTitles = page.getByTestId('inventory-item-name');
  }

  async cards(): Promise<ProductCard[]> {
    return (await this.items.all()).map((item) => new ProductCard(item));
  }

  /** Products in display order. */
  async read(): Promise<Product[]> {
    return Promise.all((await this.cards()).map((card) => card.read()));
  }

  /** Product titles in display order. */
  async readTitles(): Promise<string[]> {
    return this.itemTitles.allInnerTexts();
  }

  /** Quantity of each product in display order (cart and checkout only). */
  async readQuantities(): Promise<number[]> {
    return Promise.all((await this.cards()).map(async (card) => Number(await card.quantity.innerText())));
  }
}
