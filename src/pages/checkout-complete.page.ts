import type { Locator, Page } from '@playwright/test';
import { ShopPage } from './base.page';

/** Checkout: Complete! */
export class CheckoutCompletePage extends ShopPage {
  readonly path = '/checkout-complete.html';
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
    this.loadedMarker = this.completeHeader;
  }
}
