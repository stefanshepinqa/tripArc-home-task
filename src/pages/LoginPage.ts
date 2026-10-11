import { login } from '../locators/screens.js';
import type { Credentials } from '../types/domain.js';
import { DeviceHelper } from '../helpers/DeviceHelper.js';
import { BasePage } from './BasePage.js';
export class LoginPage extends BasePage {
  async signIn(details: Credentials): Promise<void> {
    await this.visible(login.username);
    if (DeviceHelper.platform === 'ios') {
      // Typing focuses a field and the software keyboard covers the Login
      // footer, which sits outside the scroll view. The preset row writes
      // both values without focusing either field.
      await this.click(login.savedUser(details.username), true);
    } else {
      await this.fill(login.username, details.username);
      await this.fill(login.password, details.password);
    }
    await this.click(login.submit);
  }
}
