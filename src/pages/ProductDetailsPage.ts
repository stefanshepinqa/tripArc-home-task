import { browser } from '@wdio/globals';
import { androidId as id, pair } from '../locators/strategies.js';
import { BasePage, navigation } from './BasePage.js';

const product = {
  ready: pair(id('cartBt'), '~ProductDetails-screen'),
  add: pair(id('cartBt'), '~AddToCart'),
};

export class ProductDetailsPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(product.ready); }

  /**
   * Taps "Add to Cart" and waits for the badge to reach {@link expectedBadge}.
   * Waiting for the exact count (not just > 0) prevents a stale-read when the
   * same product is added multiple times — the badge animation is async and a
   * presence-only check would pass with the old value.
   */
  async addToCart(expectedBadge = 1): Promise<void> {
    await this.waitUntilReady();
    await this.click(product.add, true);
    await browser.waitUntil(async () => {
      const count = Number(await browser.$(this.selector(navigation.badge)).getText());
      return count === expectedBadge;
    }, { timeout: 15_000, timeoutMsg: `Cart badge did not reach ${expectedBadge}` });
  }
}
