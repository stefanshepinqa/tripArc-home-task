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
    const element = await DeviceHelper.scrollTo(this.selector(locator));
    await element.waitForEnabled({ timeout: 10_000 });
    // setValue types into whichever field still has focus. Tap this one first.
    await element.click();
    await element.setValue(value);
    if (browser.isAndroid && await browser.isKeyboardShown()) await browser.hideKeyboard();
  }
  async openCart(): Promise<void> { await this.click(navigation.cart); }
}
