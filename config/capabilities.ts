import type { Platform } from '../src/types/domain.js';
import { cloudApp, deviceIds, localApp, localIosApp, required } from './environment.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const specFiles = [
  './tests/specs/purchase.spec.ts', './tests/specs/cart.spec.ts',
  './tests/specs/checkout-validation.spec.ts', './tests/specs/lifecycle.spec.ts',
].map(path => fileURLToPath(new URL(`../${path}`, import.meta.url)));

export function androidCapabilities(parallel = false, env: NodeJS.ProcessEnv = process.env) {
  const devices = deviceIds(env);
  if (parallel && devices.length !== 2) throw new Error('Parallel execution requires exactly two ANDROID_UDIDS');
  return (parallel ? devices : devices.slice(0, 1)).map((udid, index) => ({
    platformName: 'Android', 'appium:automationName': 'UiAutomator2',
    'appium:app': localApp(env), 'appium:udid': udid,
    'appium:deviceName': udid, 'appium:systemPort': 8200 + index,
    'appium:mjpegServerPort': 9100 + index,
    'appium:appPackage': 'com.saucelabs.mydemoapp.android',
    'appium:appActivity': '.view.activities.SplashActivity',
    'appium:appWaitActivity': '*.MainActivity',
    'appium:language': 'en', 'appium:locale': 'US',
    'appium:noReset': false, 'appium:fullReset': true,
    'appium:autoGrantPermissions': true, 'appium:newCommandTimeout': 120,
    'wdio:maxInstances': 1,
    // Partition specs rather than executing the whole suite on each emulator.
    ...(parallel ? { 'wdio:specs': specFiles.filter((_, i) => i % 2 === index) } : {}),
  }));
}

export function iosCapabilities(env: NodeJS.ProcessEnv = process.env) {
  const udid = env.IOS_UDID?.trim();
  const platformVersion = env.IOS_PLATFORM_VERSION?.trim();
  return [{
    platformName: 'iOS', 'appium:automationName': 'XCUITest',
    'appium:app': localIosApp(env), 'appium:bundleId': 'com.saucelabs.mydemo.app.ios',
    'appium:deviceName': env.IOS_DEVICE_NAME?.trim() || 'iPhone 16',
    ...(udid ? { 'appium:udid': udid } : {}),
    ...(platformVersion ? { 'appium:platformVersion': platformVersion } : {}),
    'appium:noReset': false, 'appium:fullReset': true,
    'appium:language': 'en', 'appium:locale': 'en_US',
    'appium:newCommandTimeout': 120, 'appium:wdaLaunchTimeout': 300_000,
    'appium:simulatorStartupTimeout': 180_000,
    'appium:derivedDataPath': resolve('.appium/wda'),
    'wdio:maxInstances': 1,
  }];
}

export function cloudCapabilities(platform: Platform, env: NodeJS.ProcessEnv = process.env) {
  const android = platform === 'android';
  return [{
    platformName: android ? 'Android' : 'iOS',
    'appium:automationName': android ? 'UiAutomator2' : 'XCUITest',
    'appium:app': cloudApp(platform, env),
    'appium:deviceName': required(android ? 'SAUCE_ANDROID_DEVICE' : 'SAUCE_IOS_DEVICE', env),
    'appium:platformVersion': required(android ? 'SAUCE_ANDROID_OS' : 'SAUCE_IOS_OS', env),
    'appium:noReset': false,
    'appium:language': 'en', 'appium:locale': android ? 'US' : 'en_US',
    'appium:newCommandTimeout': 120,
    'wdio:maxInstances': 1,
    // The suite deliberately handles its shipping-validation alert.
    ...(android ? { 'appium:autoGrantPermissions': true } : {}),
    'sauce:options': {
      appiumVersion: env.SAUCE_APPIUM_VERSION?.trim() || 'appium3-2026-10',
      name: `${platform} native business scenarios`,
      build: env.BUILD_NAME || `triparc-${new Date().toISOString().slice(0, 10)}`,
    },
  }];
}
