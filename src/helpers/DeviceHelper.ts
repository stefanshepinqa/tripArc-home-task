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
        await browser.execute('mobile: swipe', { direction: direction === 'down' ? 'up' : 'down' });
      }
    }
    throw new Error(`Control not visible after ${maxSwipes} swipes: ${selector}`);
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
