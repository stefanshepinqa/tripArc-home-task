import { expect } from '@wdio/globals';
import AllureReporter from '@wdio/allure-reporter';
import { CatalogPage, ProductDetailsPage, CartPage } from '../../src/pages/index.js';
import { FixtureHelper } from '../../src/helpers/FixtureHelper.js';

/**
 * Edge-case / flakiness-prone scenario: async badge update after "Add to Cart".
 *
 * Why this is flaky without deliberate handling:
 *   Tapping "Add to Cart" triggers an async state change — the tab-bar badge
 *   animates from empty to "1". A naïve check like `expect(badge).toExist()`
 *   or `badge > 0` would pass even if the badge still shows a stale value.
 *   Only a real value assertion — waitUntil the badge text equals the exact
 *   expected count — avoids the race.
 *
 * How our approach avoids flakiness:
 *   1. `addToCart(expectedBadge)` uses `waitUntil(count === expected)`, not
 *      `waitUntil(count > 0)`.
 *   2. `cart.readItem()` returns a full snapshot with exact cents, so the
 *      assertion catches any mismatch in quantity OR price.
 *   3. `waitForSubtotal()` polls until the subtotal matches the computed value,
 *      guarding against the UI showing a stale total from the prior quantity.
 *
 * BUG: The app increments the cart count on every "Add to Cart" tap instead of
 *      capping it at 1. Quantity should only be adjustable via the +/- controls
 *      inside the cart. This test asserts the CORRECT expected behaviour; the
 *      app's actual behaviour causes it to fail — flagged as a known defect.
 */
describe('Cart badge race condition', () => {
  it('tapping Add to Cart twice should not increase quantity beyond 1 [BUG]', async () => {
    AllureReporter.addSeverity('critical');
    AllureReporter.addIssue('ADD_TO_CART_INCREMENTS_ON_REPEAT_TAP');
    AllureReporter.addDescription(
      'Tapping "Add to Cart" a second time on the product details screen increments the cart ' +
      'count to 2. Expected: the button is idempotent and only adds 1 unit; quantity changes ' +
      'should only be possible via the +/- controls on the Cart screen.',
    );
    const product = FixtureHelper.product();
    const details = new ProductDetailsPage();
    const cart = new CartPage();

    await new CatalogPage().openProduct(product.name);

    // First tap — badge must reach exactly 1.
    await details.addToCart(1);

    // Second tap — badge should STAY at 1 (correct behaviour).
    // BUG: the app increments it to 2 instead.
    await details.addToCart(1);

    await details.openCart();

    // The cart should contain exactly 1 unit at the unit price.
    await cart.waitForSubtotal(product.unitPriceCents);
    expect(await cart.readItem()).toEqual({
      name: product.name,
      quantity: 1,
      unitPriceCents: product.unitPriceCents,
      subtotalCents: product.unitPriceCents,
    });
  });
});
