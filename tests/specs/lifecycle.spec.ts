import { expect } from '@wdio/globals';
import { CatalogPage, ProductDetailsPage, CartPage } from '../../src/pages/index.js';
import { FixtureHelper } from '../../src/helpers/FixtureHelper.js';
import { DeviceHelper } from '../../src/helpers/DeviceHelper.js';

describe('App lifecycle', () => {
  it('retains the cart after backgrounding and orientation changes', async () => {
    const product = FixtureHelper.product();
    const expected = { name: product.name, quantity: 1,
      unitPriceCents: product.unitPriceCents, subtotalCents: product.unitPriceCents };
    const details = new ProductDetailsPage();
    const cart = new CartPage();
    await new CatalogPage().openProduct(product.name);
    await details.addToCart();
    await details.openCart();
    expect(await cart.readItem()).toEqual(expected);
    await DeviceHelper.backgroundAndReactivate();
    expect(await cart.readItem()).toEqual(expected);
    await DeviceHelper.setOrientation('LANDSCAPE');
    expect(await cart.readItem()).toEqual(expected);
    await DeviceHelper.setOrientation('PORTRAIT');
    expect(await cart.readItem()).toEqual(expected);
  });
});
