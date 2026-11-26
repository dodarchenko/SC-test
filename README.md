# saucedemo & dummyjson Playwright tests

> **A quick note on my approach** 👋
>
> Though, saucedemo and dummyjson are two separate systems. But I've imagined them as **one product**: saucedemo is the web shop, and dummyjson plays the backend it doesn't really have. That's why both parts of the assignment live in **one framework**, which is how I'd want it in a real development process: one repo, one stack, one CI pipeline, one place to look when something breaks.
>
> So the API tests are written in **TypeScript with Playwright** too, not in a separate tool. Postman would probably have been the easier pick for API tests, and it's great for exploring an API by hand, but for a test suite that grows with the product I think code wins.
>
> Why I like this setup:
>
> - **UI and API tests can work together.** Since they share one runner and one set of fixtures, a test can mix both: prepare data through the API and check it in the UI, or do something in the UI and verify it at the API level. That's where the deeper, more realistic end-to-end scenarios come from.
> - **Everything is reused, nothing is copied.** Users, expected texts and error messages, the money helpers and the shared fixtures serve both UI and API tests. Change a value once and every test picks it up.
> - **Stronger checks.** Responses are validated with typed schemas, money is compared in cents, cart totals are recalculated, and products are matched against the live catalog. That's the kind of logic that stays readable in code but gets messy in per-request scripts.
> - **Proper engineering tooling.** Type checks, linting, formatting and code review work the same for every test, and a renamed field shows up as a compile error, not as a surprise in CI.
> - **One place for results.** A single HTML report with steps and traces for both kinds of tests, a single CI workflow, and one command to run any part of it.
> - **Independent tests.** Each test sets up what it needs through fixtures, so any test can run on its own, in parallel or on retry, without depending on the tests before it.

I've used Claude Opus 5.5 to generate API schemas and catalog, models, i18n, utils, gather locators and generate Page Objects.

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
tests/          the tests themselves
  ui/           saucedemo (website) tests: auth, inventory, e2e
  api/          dummyjson (API) tests: auth, products, carts
src/            the building blocks the tests use
  pages/        one class per website page
  components/   parts that appear on several pages
  fixtures/     ready-made helpers for UI tests
  api/          everything for talking to the API
  shared/       things UI and API tests both use
  models/       small data types and money helpers
  utils/        checks and tools used by UI tests
test-data/      the inputs and expected results
```

**`tests/`: the tests.** Each file reads like a scenario: sign in, add products, check the cart, and so on. They contain the steps and checks, but no low-level details like selectors or URLs.

- `ui/auth/sign-in.spec.ts`: wrong or missing credentials are rejected, both on screen and in the browser's storage.
- `ui/e2e/checkout.spec.ts`: every user buys two products from start to finish.
- `ui/inventory/sorting.spec.ts`: products sort Z to A, and bad product titles get flagged.
- `api/*.spec.ts`: login, product details, creating and deleting carts, plus two error cases.

**`src/pages/`: page objects.** One class per page of the shop (login, inventory, cart, the three checkout steps). Each knows where its buttons and fields are and how to tell the page has loaded, so tests say `cartPage.checkoutButton.click()` instead of repeating selectors. They all build on `base.page.ts`, which handles opening a page and waiting for it.

**`src/components/`: shared page parts.** The header with the cart badge, and the product list and product card that look the same on the inventory, cart and checkout pages. Written once and used by every page that shows them.

**`src/fixtures/`: helpers for UI tests.** Playwright hands these to a test when it asks for them: page objects, plus bigger actions like `signInViaUI`, `signInViaState`, `addRandomProductToCart`, and checks like `verifyCart` and `verifyCheckoutOverview`.

**`src/api/`: talking to the API.**

- `clients.ts`: one small class per group of endpoints (auth, products, carts). Each method sends one request, and the report shows it as a step named after it, like `GET /products/42`.
- `schemas/`: what each response must look like (fields, types, allowed ranges), written with zod.
- `response.ts`: `expectResponse` and `expectError` check the status and validate the body in one line.
- `catalog.ts`: loads the live product list, so tests pick real products instead of hardcoded ids.
- `fixtures.ts`: hands the clients, the catalog and a logged-in user to API tests.

**`src/shared/`: used by both UI and API tests.** `env.ts` reads settings like URLs and passwords from the environment (`.env` locally, secrets in CI), and `base.fixture.ts` provides the expected texts (`messages`) to every test.

**`src/models/`: simple data types.** What a product looks like, and helpers for money: reading `$29.99` from the page, and comparing amounts in cents so rounding never causes false failures.

**`src/utils/`: tools for UI tests.** Reading and writing the browser state the site keeps (`browser-state.ts`), the shared cart checks (`cart-assertions.ts`), the product-title rules (`product-title.ts`), and `report.ts`, which adds notes and attachments to the test report.

**`test-data/`: inputs and expected results.** Kept apart from the tests, so changing data never means touching test code.

- `users.ts`: the test accounts and which ones have known defects (passwords come from the environment).
- `sign-in.ts`: the failed sign-in cases, built from the user list.
- `checkout.ts`, `inventory.ts`, `carts.ts`: customer details, sort options, cart sizes.
- `i18n/`: every text the tests expect, from the site and from the API, per language.

**In the root:** `playwright.config.ts` (projects, browsers, URLs), `.env.example` (the settings you need to fill in), `.github/workflows/tests.yml` (CI), plus lint, format and TypeScript settings.

### Site texts and locales

Every text the tests expect from the site (errors, page titles, button and sort labels) lives in [`test-data/i18n/`](test-data/i18n), never in specs or page objects. Tests read them through the `messages` fixture, which picks the dictionary for the test's `locale`:

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

The workflow is a single job: it runs `npm run check` (typecheck, lint, format) first and stops there if that fails, then the selected tests, and uploads the HTML report as an artifact (`playwright-report-<scope>`, kept 14 days). Failures also appear as annotations on the run and the pull request.

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
