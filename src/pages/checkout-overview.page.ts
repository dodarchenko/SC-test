import type { Locator, Page } from '@playwright/test';
import { ProductList } from '@components/product-list';
import { parseMoney } from '@models/money';
import { ShopPage } from './base.page';

interface CheckoutSummary {
  readonly itemTotal: number;
  readonly tax: number;
  readonly total: number;
}

/** Checkout: Overview (step two). */
export class CheckoutOverviewPage extends ShopPage {
  readonly path = '/checkout-step-two.html';
  readonly products: ProductList;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.products = new ProductList(page);
    this.itemTotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
    this.loadedMarker = this.totalLabel;
  }

  async readSummary(): Promise<CheckoutSummary> {
    const [itemTotal, tax, total] = await Promise.all(
      [this.itemTotalLabel, this.taxLabel, this.totalLabel].map(async (label) => parseMoney(await label.innerText())),
    );
    return { itemTotal, tax, total };
  }
}
