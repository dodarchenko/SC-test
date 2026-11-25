# saucedemo & dummyjson Playwright tests

Written with [Playwright](https://playwright.dev) and TypeScript:

- **UI tests** for saucedemo, in Chromium and Firefox (`tests/ui`)
- **API tests** for the dummyjson REST API, no browser (`tests/api`, see [API tests](#api-tests))

saucedemo runs entirely in the browser and has no API, so the tests check both what's on the screen **and** the browser state the app keeps:

| State              | Where           | Meaning                               |
| ------------------ | --------------- | ------------------------------------- |
| `session-username` | cookie (10 min) | who is signed in                      |
| `cart-contents`    | localStorage    | JSON array of product ids in the cart |

## Getting started

Requires Node 22 (see [`.nvmrc`](.nvmrc); `nvm use` picks it up).

```bash
npm install
npx playwright install
cp .env.example .env   # then fill in the credentials (and URLs, unless you run locally)
npm test
```

| Script                                              | What it does                                            |
| --------------------------------------------------- | ------------------------------------------------------- |
| `npm test`                                          | all tests: UI (Chromium, Firefox) and API               |
| `npm run test:ui`                                   | UI tests, Chromium and Firefox                          |
| `npm run test:api`                                  | API tests                                               |
| `npm run test:e2e` / `test:auth` / `test:inventory` | UI tests with that tag                                  |
| `npm run test:chromium`                             | UI tests, Chromium only                                 |
| `npm run test:smoke`                                | tests tagged `@smoke`                                   |
| `npm run test:headed`                               | all tests with a visible browser                        |
| `npm run report`                                    | opens the last HTML report                              |
| `npm run check`                                     | typecheck + lint + format check (run before committing) |
| `npm run lint:fix` / `npm run format`               | fix lint and formatting issues                          |

### Environment variables

URLs of the systems under test and test account credentials are **not stored in the repository**. Locally, put them in `.env` (untracked; copy [`.env.example`](.env.example)); in CI, set them as pipeline variables or secrets. A missing required variable stops the run with a message naming it. Locally, without `BASE_URL` / `API_BASE_URL`, tests run against local dev servers at `http://localhost:3000` (UI) and `http://localhost:8888` (API); set them to run against hosted instances. On CI both are required.

| Variable         | Default                 | Purpose                                   |
| ---------------- | ----------------------- | ----------------------------------------- |
| `BASE_URL`       | `http://localhost:3000` | site under test (UI)                      |
| `API_BASE_URL`   | `http://localhost:8888` | API under test                            |
| `API_USERNAME`   | required                | dummyjson account for API tests           |
| `API_PASSWORD`   | required                | its password                              |
| `SAUCE_PASSWORD` | required                | password shared by all test users         |
| `LOCALE`         | `en-US`                 | browser locale and expected site texts    |
| `CI`             | unset                   | enables retries, 1 worker, no `test.only` |

## Project layout

```
src/
  api/          API tests: clients, zod response schemas, catalog, fixtures ('@api/fixtures')
  pages/        page objects; BasePage → ShopPage (pages after sign in) → each page
  components/   parts shared by pages: Header, ProductList, ProductCard
  fixtures/     UI fixtures, chained shared base → auth → cart → checkout; import from '@fixtures'
  models/       Product type, money parsing and formatting
  utils/        browser state (BrowserState: session cookie, stored cart), cart assertions, reporting
  shared/       base fixture shared by UI and API tests (messages)
test-data/      users, customers, sign-in cases and other test inputs
  i18n/         expected texts per locale (en.ts): site texts and API error messages
  carts.ts      shape of the carts the API tests create
tests/
  ui/           saucedemo specs, grouped by area (auth, inventory, e2e)
  api/          dummyjson specs, one file per endpoint group (auth, products, carts)
```

Path aliases (`@fixtures`, `@api/*`, `@shared/*`, `@pages/*`, `@components/*`, `@models/*`, `@utils/*`, `@data/*`) are set in `tsconfig.json`.

### Fixtures

| Fixture                                  | What it does                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `signInViaUI(user)`                      | signs in through the login form                                                        |
| `signInViaState(user, { cartItemIds? })` | signs in by setting the session cookie (and cart) directly, no form                    |
| `addRandomProductToCart()`               | adds a random product from the inventory; returns its id, title and price              |
| `verifyCart(products)`                   | checks the cart page and `cart-contents` against the given products                    |
| `verifyCheckoutOverview(products)`       | checks checkout step two: products, prices, item total, tax, total and `cart-contents` |
| `expectEmptyCart(page)`                  | checks there is no cart badge and `cart-contents` is empty                             |

The `verify…` fixtures check the page the browser is already on and fail if it doesn't load; they never navigate, so a broken link or button can't go unnoticed.

Page objects are also available as fixtures (`loginPage`, `inventoryPage`, `cartPage`, …), as is `session` (a `BrowserState`) for reading and writing the session cookie and stored cart.

### Site texts and locales

Every text the tests expect from the site (errors, page titles, button and sort labels) lives in [`test-data/i18n/`](test-data/i18n), never in specs or page objects. Tests read them through the `messages` fixture, which picks the dictionary for the test's `locale`:

```ts
test('…', async ({ messages, loginPage }) => {
  await expect(loginPage.errorMessage).toHaveText(messages.login.errors.lockedOut);
});
```

- `en.ts` is the source locale and defines the keys. A new locale (e.g. `nl.ts`) is typed as `Messages`, so a missing key is a compile error; register it in `i18n/index.ts`.
- `en-US` falls back to `en`; a regional file such as `en-GB` is used when registered.
- Texts with values use `{placeholders}`: `formatMessage(messages.login.errors.protectedRoute, { path })`.
- Run in another locale with `LOCALE=nl-NL npm test`, or per file with `test.use({ locale: 'nl-NL' })`.
- Page objects detect state by `data-test` attributes, not texts, so they work in any locale.

## CI (GitHub Actions)

[`.github/workflows/tests.yml`](.github/workflows/tests.yml) runs on every push to `main` and every pull request (all tests), and on demand from **Actions › Tests › Run workflow**, where you pick a scope:

| Scope       | Runs                                       |
| ----------- | ------------------------------------------ |
| `all`       | UI tests (Chromium, Firefox) and API tests |
| `ui`        | all UI tests                               |
| `api`       | all API tests (no browsers installed)      |
| `e2e`       | UI tests tagged `@e2e` (checkout)          |
| `auth`      | UI tests tagged `@auth` (failed sign in)   |
| `inventory` | UI tests tagged `@inventory` (sorting)     |

Or from the command line: `gh workflow run tests.yml -f scope=api`.

The workflow is a single job: it runs `npm run check` (typecheck, lint, format) first and stops there if that fails, then the selected tests, and uploads the HTML report as an artifact (`playwright-report-<scope>`, kept 14 days). Failures also appear as annotations on the run and the pull request.

**One-time setup** (Settings › Secrets and variables › Actions):

- **Variables**: `BASE_URL`, `API_BASE_URL`, the hosted instances to test (on a CI runner the localhost defaults don't apply)
- **Secrets**: `SAUCE_PASSWORD`, `API_USERNAME`, `API_PASSWORD`

If a URL or credential is missing, the run stops with a message naming it. Each scope is the npm script of the same name (`npm run test:<scope>`), so CI and local runs use the same commands.

The scopes that include the saucedemo UI (`all`, `ui`, `auth`, `inventory`) currently end red, because of the two real defects listed under [Known site defects](#known-site-defects). That's intended: they stay visible until fixed.

## Known site defects

saucedemo builds bugs into some accounts on purpose. The tests document them instead of hiding them:

- **Expected failures** — accounts with a `knownIssue` in [`test-data/users.ts`](test-data/users.ts) run the checkout flow with `test.fail()`. The reason shows in the report, and Playwright flags the test if it ever starts passing.
  - `problem_user`: "Add to cart" does nothing for some products; the checkout form rejects valid data
  - `error_user`: "Add to cart" does nothing for some products; "Finish" doesn't complete the order
  - `visual_user`: inventory shows wrong prices
- **Failing checks** — real defects outside those accounts make tests fail:
  - `locked_out_user` gets a session cookie even though sign in is refused (`tests/ui/auth/sign-in.spec.ts`)
  - the product title `Test.allTheThings() T-Shirt (Red)` contains code (`tests/ui/inventory/sorting.spec.ts`)

Findings are also recorded in the HTML report as annotations and JSON attachments.

## API tests

`tests/api` runs in the `api` project: its own `baseURL` (`API_BASE_URL`), no browser.

| Spec               | Cases                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `auth.spec.ts`     | successful login (then `/auth/me` with the token returns the same user); wrong password → 400         |
| `products.spec.ts` | a random product's content (schema, matches the catalog, consistent); unknown id → 404                |
| `carts.spec.ts`    | cart with 3 random products for the logged-in user (lines and totals); delete one of the user's carts |

How it's built:

- **Clients** ([`src/api/clients.ts`](src/api/clients.ts)) wrap each endpoint and return the raw response, so tests choose the expected status, including for negative cases. Each request shows in the report as a step named after it (e.g. `GET /products/42`), and request bodies are validated before sending.
- **`expectResponse(response, status, schema)`** checks the status and JSON content type, and validates the body with a [zod](https://zod.dev) schema ([`src/api/schemas`](src/api/schemas)); failures show the URL and the body. **`expectError(response, status, message)`** does the same for error responses, with a strict schema so an error can't carry tokens or data.
- **No hardcoded ids**: the `catalog` fixture loads the live catalog to pick random products and to find an id that doesn't exist. Picks are recorded in the report automatically.
- **`loggedInUser`** logs in as `apiUser` from [`test-data/users.ts`](test-data/users.ts), the same `User` type as the saucedemo accounts (dummyjson only accepts its own users); the cart tests use its id ("same user"). Expected API errors come from the shared i18n messages (`messages.api.errors`).
- **Money** is compared in cents: the API returns raw float sums such as `209.96999999999997`.
- dummyjson **simulates writes**: a created cart isn't stored and a delete returns the cart flagged `isDeleted`. So the delete test removes one of the user's existing carts, and created-cart lines call the discounted amount `discountedPrice` (stored carts: `discountedTotal`).
