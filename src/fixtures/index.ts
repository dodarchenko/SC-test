// Single entry point for UI specs. Each fixture file extends the previous one
// (shared base → auth → cart → checkout), so the last one holds all fixtures.
export { expect } from '@playwright/test';
export { test } from './checkout.fixture';
export type { BaseFixtures } from '@shared/base.fixture';
export type { AuthFixtures, StateSignInOptions } from './auth.fixture';
export type { CartFixtures } from './cart.fixture';
export type { CheckoutFixtures } from './checkout.fixture';
