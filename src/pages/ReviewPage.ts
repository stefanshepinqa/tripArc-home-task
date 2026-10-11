import { androidId as id, iosButton, iosText, pair } from '../locators/strategies.js';
import { MoneyHelper } from '../helpers/MoneyHelper.js';
import { DeviceHelper } from '../helpers/DeviceHelper.js';
import { BasePage } from './BasePage.js';

const iosCell = '//XCUIElementTypeTable/XCUIElementTypeCell[1]';
const iosReviewFooter = '//XCUIElementTypeStaticText[@label="Total:"]/..';

const review = {
  ready: pair(id('enterShippingAddressTV'), iosText('Review your order')),
  name: pair(id('titleTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"Sauce Labs")]`),
  unitPrice: pair(id('priceTV'), `${iosCell}//XCUIElementTypeStaticText[starts-with(@label,"$")]`),
  total: pair(id('totalAmountTV'), `${iosReviewFooter}/XCUIElementTypeStaticText[last()]`),
  quantity: pair(id('itemNumberTV'), `${iosReviewFooter}/XCUIElementTypeStaticText[contains(@label,"item")]`),
  placeOrder: pair(id('paymentBtn'), iosButton('Place Order')),
};

export class ReviewPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(review.ready); }
  async readOrder() {
    await this.waitUntilReady();
    const name = await this.text(review.name);
    const unitPriceCents = MoneyHelper.toCents(await this.text(review.unitPrice));
    await DeviceHelper.scrollTo(this.selector(review.total));
    const totalCents = MoneyHelper.toCents(await this.text(review.total));
    const quantity = Number.parseInt(await this.text(review.quantity), 10);
    return { name, quantity, unitPriceCents, totalCents };
  }
  async placeOrder(): Promise<void> { await this.click(review.placeOrder, true); }
}
