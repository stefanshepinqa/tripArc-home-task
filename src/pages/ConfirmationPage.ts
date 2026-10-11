import { androidId as id, iosText, pair } from '../locators/strategies.js';
import { BasePage } from './BasePage.js';

const confirmation = {
  heading: pair(id('completeTV'), iosText('Checkout Complete')),
};

export class ConfirmationPage extends BasePage {
  async readHeading(): Promise<string> { return this.text(confirmation.heading); }
}
