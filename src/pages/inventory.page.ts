import type { Locator, Page } from '@playwright/test';
import { ProductList } from '@components/product-list';
import { sortOptionValues, type SortOption } from '@data/inventory';
import { ShopPage } from './base.page';

export class InventoryPage extends ShopPage {
  readonly path = '/inventory.html';
  readonly products: ProductList;
  readonly sortSelect: Locator;
  /** Label of the currently selected sort option. */
  readonly activeSortOption: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.products = new ProductList(page);
    this.sortSelect = page.getByTestId('product-sort-container');
    this.activeSortOption = page.getByTestId('active-option');
    this.loadedMarker = this.products.items.first();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(sortOptionValues[option]);
  }
}
