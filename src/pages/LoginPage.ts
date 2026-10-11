import { androidId as id, iosButton, iosPredicate, pair } from '../locators/strategies.js';
import type { Credentials } from '../types/domain.js';
import { DeviceHelper } from '../helpers/DeviceHelper.js';
import { BasePage } from './BasePage.js';

const login = {
  username: pair(id('nameET'), '-ios class chain:**/XCUIElementTypeTextField[1]'),
  password: pair(id('passwordET'), '-ios class chain:**/XCUIElementTypeSecureTextField[1]'),
  savedUser: (email: string) => pair(id('nameET'), iosPredicate(`type == 'XCUIElementTypeButton' AND name == ${JSON.stringify(email)}`)),
  submit: pair(id('loginBtn'), iosButton('Login')),
};

export class LoginPage extends BasePage {
  async signIn(details: Credentials): Promise<void> {
    await this.visible(login.username);
    if (DeviceHelper.platform === 'ios') {
      await this.click(login.savedUser(details.username), true);
    } else {
      await this.fill(login.username, details.username);
      await this.fill(login.password, details.password);
    }
    await this.click(login.submit);
  }
}
