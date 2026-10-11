import { browser } from '@wdio/globals';
import { androidId as id, iosButton, iosPredicate, iosText, pair } from '../locators/strategies.js';
import type { ShippingDetails } from '../types/domain.js';
import { BasePage } from './BasePage.js';
import { DeviceHelper } from '../helpers/DeviceHelper.js';

const field = (android: string, placeholder: string) =>
  pair(id(android), iosPredicate(`type == 'XCUIElementTypeTextField' AND value == ${JSON.stringify(placeholder)}`));

const shipping = {
  ready: pair(id('enterShippingAddressTV'), iosText('Enter a shipping address')),
  fullName: field('fullNameET', 'Rebecca Winter'),
  address1: field('address1ET', 'Mandorley 112'),
  city: field('cityET', 'Truro'),
  state: field('stateET', 'Cornwall'),
  zip: field('zipET', '89750'),
  country: field('countryET', 'United Kingdom'),
  submit: pair(id('paymentBtn'), iosButton('To Payment')),
  nameError: pair(id('fullNameErrorTV'), iosText('Please provide your full name.')),
  dismissError: pair(id('fullNameErrorTV'), iosButton('OK')),
};

export class ShippingPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(shipping.ready); }
  async fillAddress(details: ShippingDetails): Promise<void> {
    await this.waitUntilReady();
    await this.fill(shipping.fullName, details.fullName);
    await this.fill(shipping.address1, details.address1);
    await this.fill(shipping.city, details.city);
    await this.fill(shipping.zip, details.zip);
    await this.fill(shipping.country, details.country);
    await this.fill(shipping.state, details.state);
    if (browser.isIOS && (await browser.isKeyboardShown())) {
      await browser.background(1);
    }
  }
  async submitShipping(): Promise<void> { await this.click(shipping.submit, true); }
  async readNameValidation(): Promise<string> {
    if (browser.isAndroid) {
      await DeviceHelper.scrollTo(this.selector(shipping.nameError), 6, 'up');
    }
    return this.text(shipping.nameError);
  }
  async dismissValidation(): Promise<void> {
    if (browser.isIOS) await this.click(shipping.dismissError);
  }
  async isCurrentScreen(): Promise<boolean> {
    return browser.$(this.selector(shipping.ready)).isDisplayed();
  }
}
