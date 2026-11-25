import type { Locator, Page } from '@playwright/test';
import { ProductList } from '@components/product-list';
import { ShopPage } from './base.page';

export class CartPage extends ShopPage {
  readonly path = '/cart.html';
  readonly products: ProductList;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.products = new ProductList(page);
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.loadedMarker = this.checkoutButton;
  }
}
