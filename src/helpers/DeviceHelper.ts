import { browser } from '@wdio/globals';
import type { Platform } from '../types/domain.js';

export class DeviceHelper {
  static get platform(): Platform { return browser.isAndroid ? 'android' : 'ios'; }

  static async scrollTo(selector: string, maxSwipes = 6, direction: 'down' | 'up' = 'down'): Promise<WebdriverIO.Element> {
    for (let attempt = 0; attempt <= maxSwipes; attempt++) {
      const element = await browser.$(selector).getElement();
      if (await element.isDisplayed()) return element;
      if (attempt === maxSwipes) break;
      if (browser.isAndroid) {
        const { width, height } = await browser.getWindowSize();
        await browser.execute('mobile: scrollGesture', {
          left: Math.round(width * 0.1), top: Math.round(height * 0.2),
          width: Math.round(width * 0.8), height: Math.round(height * 0.6),
          direction, percent: 0.7,
        });
      } else {
        // Use native scrollToElement when the element exists in the tree but is off-screen.
        // This handles landscape where the cart table is shorter than the cell content.
        try {
          await browser.execute('mobile: scrollToElement', { elementId: element.elementId });
        } catch {
          // Fall back to a page scroll on the screen.
          await browser.execute('mobile: scroll', { direction, distance: 0.5 });
        }
      }
    }
    throw new Error(`Control not visible after ${maxSwipes} swipes: ${selector}`);
  }

  static async setOrientation(orientation: 'PORTRAIT' | 'LANDSCAPE'): Promise<void> {
    // MainActivity declares android:screenOrientation="portrait", so ROTATION_270 is rejected.
    if (browser.isAndroid) {
      const current = await browser.getOrientation();
      if (current !== 'PORTRAIT') throw new Error(`Android demo app should stay portrait, but was ${current}`);
      return;
    }
    if ((await browser.getOrientation()) === orientation) return;
    await browser.setOrientation(orientation);
    await browser.waitUntil(async () => (await browser.getOrientation()) === orientation, {
      timeout: 10_000, timeoutMsg: `Device did not rotate to ${orientation}`,
    });
  }

  static async backgroundAndReactivate(): Promise<void> {
    const appId = browser.isAndroid ? 'com.saucelabs.mydemoapp.android' : 'com.saucelabs.mydemo.app.ios';
    await browser.background(-1);
    await browser.waitUntil(async () => (await browser.queryAppState(appId)) !== 4,
      { timeout: 10_000, timeoutMsg: 'App never entered background' });
    await browser.activateApp(appId);
    await browser.waitUntil(async () => (await browser.queryAppState(appId)) === 4,
      { timeout: 10_000, timeoutMsg: 'App did not return to foreground' });
  }
}
