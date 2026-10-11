import { browser } from '@wdio/globals';
import { LocatorHelper, type PlatformLocator } from '../locators/strategies.js';
import { DeviceHelper } from '../helpers/DeviceHelper.js';
import { navigation } from '../locators/screens.js';

export abstract class BasePage {
  protected selector(locator: PlatformLocator): string {
    return LocatorHelper.resolve(locator, DeviceHelper.platform);
  }
  protected async visible(locator: PlatformLocator): Promise<WebdriverIO.Element> {
    const element = await browser.$(this.selector(locator)).getElement();
    await element.waitForDisplayed({ timeout: 15_000 });
    return element;
  }
  protected async click(locator: PlatformLocator, scroll = false): Promise<void> {
    const element = scroll
      ? await DeviceHelper.scrollTo(this.selector(locator)) : await this.visible(locator);
    await element.waitForEnabled({ timeout: 10_000 });
    await element.click();
  }
  protected async text(locator: PlatformLocator): Promise<string> {
    return (await this.visible(locator)).getText();
  }
  protected async fill(locator: PlatformLocator, value: string): Promise<void> {
    const sel = this.selector(locator);
    let element = await browser.$(sel).getElement();
    if (!(await element.isDisplayed())) {
      element = await DeviceHelper.scrollTo(sel, 2);
    }
    await element.waitForEnabled({ timeout: 10_000 });
    await element.click();
    await element.setValue(value);
    if (browser.isAndroid) {
      if (await browser.isKeyboardShown()) await browser.hideKeyboard();
      return;
    }
    // Return dismisses the keyboard on every field except the last in the tab order.
    if (await browser.isKeyboardShown()) {
      const returnKey = await browser.$('~Return');
      if (await returnKey.isDisplayed()) await returnKey.click();
    }
  }
  async openCart(): Promise<void> { await this.click(navigation.cart); }
}
