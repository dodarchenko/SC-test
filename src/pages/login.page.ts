import type { Locator, Page } from '@playwright/test';
import type { Credentials } from '@data/users';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  /**
   * Class marking an input as invalid (red border). Inputs always carry
   * `input_error`, so only the standalone `error` token means an error is shown.
   */
  static readonly invalidInputClass = /(^|\s)error(\s|$)/;

  readonly path = '/';
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;
  /** Red "x" icons shown inside the inputs while an error is displayed. */
  readonly errorIcons: Locator;
  protected readonly loadedMarker: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.errorCloseButton = page.getByTestId('error-button');
    this.errorIcons = page.locator('form .error_icon');
    this.loadedMarker = this.loginButton;
  }

  /** Inputs the page highlights as invalid. */
  get inputs(): Locator[] {
    return [this.usernameInput, this.passwordInput];
  }

  /** Fills the form and submits. Makes no assumption about the outcome. */
  async signIn({ username, password }: Credentials): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async dismissError(): Promise<void> {
    await this.errorCloseButton.click();
  }
}
