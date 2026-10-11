import { browser } from '@wdio/globals';
import { androidId as id, iosButton, iosPredicate, iosText, pair } from '../locators/strategies.js';
import type { PaymentDetails } from '../types/domain.js';
import { BasePage } from './BasePage.js';

const field = (android: string, placeholder: string) =>
  pair(id(android), iosPredicate(`type == 'XCUIElementTypeTextField' AND value == ${JSON.stringify(placeholder)}`));

const payment = {
  ready: pair(id('enterPaymentMethodTV'), iosText('Enter a payment method')),
  fullName: field('nameET', 'Maxim Winter'),
  cardNumber: field('cardNumberET', '3258 1265 7568 7896'),
  expiry: field('expirationDateET', '03/25'),
  securityCode: field('securityCodeET', '123'),
  submit: pair(id('paymentBtn'), iosButton('Review Order')),
};

export class PaymentPage extends BasePage {
  async waitUntilReady(): Promise<void> { await this.visible(payment.ready); }
  async enterPayment(details: PaymentDetails): Promise<void> {
    await this.waitUntilReady();
    await this.fill(payment.fullName, details.fullName);
    await this.fill(payment.cardNumber, details.cardNumber);
    await this.fill(payment.expiry, details.expiry);
    await this.fill(payment.securityCode, details.securityCode);
    if (browser.isIOS && (await browser.isKeyboardShown())) {
      await browser.background(1);
    }
  }
  async reviewOrder(): Promise<void> { await this.click(payment.submit, true); }
}
