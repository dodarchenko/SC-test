import type { Locator, Page } from '@playwright/test';
import type { Customer } from '@data/checkout';
import { ShopPage } from './base.page';

/** Checkout: Your Information (step one). */
export class CheckoutInformationPage extends ShopPage {
  readonly path = '/checkout-step-one.html';
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
    this.loadedMarker = this.firstNameInput;
  }

  /** Fills the form and continues. Makes no assumption about the outcome. */
  async submit({ firstName, lastName, postalCode }: Customer): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }
}
