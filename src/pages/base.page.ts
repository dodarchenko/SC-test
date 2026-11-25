import type { Locator, Page } from '@playwright/test';
import { Header } from '@components/header';

/** Behaviour shared by every page object: where it lives and how to tell it has loaded. */
export abstract class BasePage {
  /** URL path of the page, relative to `baseURL`. */
  abstract readonly path: string;
  /** Element whose presence means the page has rendered. */
  protected abstract readonly loadedMarker: Locator;

  constructor(protected readonly page: Page) {}

  /** Navigates to the page without waiting for it, e.g. to check a redirect. */
  async navigate(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Navigates to the page and waits until it has loaded. */
  async open(): Promise<void> {
    await this.navigate();
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL(`**${this.path}`);
    await this.loadedMarker.waitFor();
  }

  private isCurrent(): boolean {
    return new URL(this.page.url()).pathname === this.path;
  }

  /** Opens the page unless the browser is already on it. */
  async ensureOpen(): Promise<void> {
    if (this.isCurrent()) await this.waitForLoaded();
    else await this.open();
  }
}

/** A page of the shop shown after sign in, with the header and a page title. */
export abstract class ShopPage extends BasePage {
  readonly header: Header;
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.title = page.getByTestId('title');
  }
}
