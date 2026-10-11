import { iosText, pair } from '../locators/strategies.js';
import { BasePage } from './BasePage.js';

const catalog = {
  ready: pair('~title', '~Catalog-screen'),
  product: (name: string) => pair(
    `//*[@resource-id="com.saucelabs.mydemoapp.android:id/titleTV" and @text=${JSON.stringify(name)}]/../*[@resource-id="com.saucelabs.mydemoapp.android:id/productIV"]`,
    iosText(name),
  ),
};

export class CatalogPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(catalog.ready); }
  async openProduct(name: string): Promise<void> {
    await this.waitUntilReady();
    await this.click(catalog.product(name), true);
  }
}
