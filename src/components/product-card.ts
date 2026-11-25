import type { Locator } from '@playwright/test';
import { parseMoney } from '@models/money';
import type { Product } from '@models/product';

/** A single product row, as rendered on inventory, cart and checkout pages. */
export class ProductCard {
  readonly title: Locator;
  readonly price: Locator;
  /** "Add to cart" or "Remove", depending on cart state. Absent on checkout overview. */
  readonly actionButton: Locator;
  /** Only rendered on cart and checkout pages. */
  readonly quantity: Locator;
  private readonly titleLink: Locator;

  constructor(root: Locator) {
    this.title = root.getByTestId('inventory-item-name');
    this.price = root.getByTestId('inventory-item-price');
    // Image/title links also carry role="button", so match the real button by test id.
    this.actionButton = root.locator('button[data-test^="add-to-cart-"], button[data-test^="remove-"]');
    this.quantity = root.getByTestId('item-quantity');
    this.titleLink = root.locator('[data-test$="-title-link"]');
  }

  /** Reads the button's test id ("remove-…" vs "add-to-cart-…"), so it works in any locale. */
  async isInCart(): Promise<boolean> {
    return (await this.actionButton.getAttribute('data-test'))?.startsWith('remove-') ?? false;
  }

  async read(): Promise<Product> {
    const [title, priceLabel, linkTestId] = await Promise.all([
      this.title.innerText(),
      this.price.innerText(),
      this.titleLink.getAttribute('data-test'),
    ]);
    const id = Number(linkTestId?.match(/^item-(\d+)-title-link$/)?.[1]);
    if (Number.isNaN(id)) throw new Error(`Cannot read product id for "${title}"`);
    return { id, title: title.trim(), price: parseMoney(priceLabel) };
  }
}
