import { browser } from '@wdio/globals';
import { androidId as id, iosButton, pair } from '../locators/strategies.js';
import { MoneyHelper } from '../helpers/MoneyHelper.js';
import type { CartSnapshot } from '../types/domain.js';
import { BasePage } from './BasePage.js';

const iosCell = '//XCUIElementTypeTable/XCUIElementTypeCell[1]';
const iosCartFooter = '//XCUIElementTypeStaticText[@label="Total:"]/..';

const cart = {
  ready: pair(id('cartBt'), '~ProceedToCheckout'),
  name: pair(id('titleTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"Sauce Labs")]`),
  price: pair(id('priceTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"$")]`),
  quantity: pair(id('noTV'), `${iosCell}//XCUIElementTypeStaticText[string(number(@label)) != "NaN"]`),
  increase: pair(id('plusIV'), iosButton('AddPlus Icons')),
  decrease: pair(id('minusIV'), iosButton('SubtractMinus Icons')),
  subtotal: pair(id('totalPriceTV'), `${iosCartFooter}/XCUIElementTypeStaticText[last()]`),
  checkout: pair(id('cartBt'), '~ProceedToCheckout'),
};

export class CartPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(cart.ready); }
  async readItem(): Promise<CartSnapshot> {
    await this.waitUntilReady();
    const name = await this.text(cart.name);
    const unitPriceCents = MoneyHelper.toCents(await this.text(cart.price));
    const subtotalCents = MoneyHelper.toCents(await this.text(cart.subtotal));
    // On iOS in landscape the cart table viewport is shorter than its cell,
    // so the quantity label reports visible="false" even though getText() works
    // (same pattern as the tab-bar badge). Read it directly instead of scrolling.
    const qty = await browser.$(this.selector(cart.quantity)).getElement();
    const quantity = Number(await qty.getText());
    return { name, quantity, unitPriceCents, subtotalCents };
  }
  async changeQuantity(target: number): Promise<void> {
    if (!Number.isInteger(target) || target < 1 || target > 10) throw new Error('Quantity must be 1–10');
    let current = (await this.readItem()).quantity;
    while (current !== target) {
      const next = current + (target > current ? 1 : -1);
      await this.click(target > current ? cart.increase : cart.decrease);
      await browser.waitUntil(async () => Number(await this.text(cart.quantity)) === next,
        { timeout: 10_000, timeoutMsg: `Cart quantity did not become ${next}` });
      current = next;
    }
  }
  async waitForSubtotal(cents: number): Promise<void> {
    await browser.waitUntil(async () => MoneyHelper.toCents(await this.text(cart.subtotal)) === cents,
      { timeout: 10_000, timeoutMsg: `Cart subtotal did not become ${cents} cents` });
  }
  async proceedToCheckout(): Promise<void> { await this.click(cart.checkout); }
}
