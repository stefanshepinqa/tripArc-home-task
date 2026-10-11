import { browser } from '@wdio/globals';
import { androidId as id, pair } from '../locators/strategies.js';
import { BasePage, navigation } from './BasePage.js';

const product = {
  ready: pair(id('cartBt'), '~ProductDetails-screen'),
  add: pair(id('cartBt'), '~AddToCart'),
};

export class ProductDetailsPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(product.ready); }
  async addToCart(): Promise<void> {
    await this.waitUntilReady();
    await this.click(product.add, true);
    // XCUITest reports this tab-bar count as visible="false" even when its label is on screen.
    await browser.waitUntil(async () => {
      const count = Number(await browser.$(this.selector(navigation.badge)).getText());
      return Number.isInteger(count) && count > 0;
    }, { timeout: 15_000, timeoutMsg: 'Cart badge did not update after adding product' });
  }
}
