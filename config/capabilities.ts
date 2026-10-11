import type { Platform } from '../src/types/domain.js';
import { cloudApp, deviceIds, localApp, localIosApp, required } from './environment.js';
import { spawnSync } from 'node:child_process';
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
    // fullReset would be a heavier wipe. noReset false still uninstalls and reinstalls the APK.
    'appium:noReset': false, 'appium:fullReset': false,
    'appium:autoGrantPermissions': true, 'appium:newCommandTimeout': 120,
    'wdio:maxInstances': 1,
    // Partition specs rather than executing the whole suite on each emulator.
    ...(parallel ? { 'wdio:specs': specFiles.filter((_, i) => i % 2 === index) } : {}),
  }));
}

interface SimRuntime { identifier?: string; version?: string; isAvailable?: boolean }
interface SimDevice { udid?: string; name?: string; state?: string; isAvailable?: boolean }

function simctlJson<T>(args: string[]): T {
  const result = spawnSync('xcrun', ['simctl', ...args], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Could not run simctl ${args.join(' ')}. ${result.stderr || result.stdout || result.error?.message || ''}`.trim());
  }
  return JSON.parse(result.stdout) as T;
}

// Appium matches simulators on the runtime id (iOS-18-3 -> 18.3). The runtime's
// marketed version is 18.3.1. Passing that makes Appium miss iPhone 16, create
// an appiumTest simulator, and delete it when the spec ends.
function sdkFromRuntime(identifier: string): string | undefined {
  return identifier.match(/SimRuntime\.iOS-(\d+(?:-\d+)*)/)?.[1]?.replace(/-/g, '.');
}

function selectIosSimulator(env: NodeJS.ProcessEnv): { udid: string; name: string; platformVersion: string } {
  const name = env.IOS_DEVICE_NAME?.trim() || 'iPhone 16';
  const requestedUdid = env.IOS_UDID?.trim();
  const requestedVersion = env.IOS_PLATFORM_VERSION?.trim();
  const { runtimes = [] } = simctlJson<{ runtimes?: SimRuntime[] }>(['list', 'runtimes', 'available', '-j']);
  const { devices = {} } = simctlJson<{ devices?: Record<string, SimDevice[]> }>(['list', 'devices', 'available', '-j']);
  const candidates = Object.entries(devices).flatMap(([runtimeId, list]) => {
    const platformVersion = sdkFromRuntime(runtimeId);
    const runtimeVersion = runtimes.find(runtime => runtime.identifier === runtimeId && runtime.isAvailable !== false)?.version;
    if (!platformVersion) return [];
    return list.flatMap(device => {
      if (device.isAvailable === false || !device.udid || !device.name) return [];
      if (requestedVersion && requestedVersion !== platformVersion && requestedVersion !== runtimeVersion) return [];
      return [{ udid: device.udid, name: device.name, state: device.state ?? '', platformVersion }];
    });
  });
  const chosen = requestedUdid
    ? candidates.find(device => device.udid.toLowerCase() === requestedUdid.toLowerCase())
    : candidates
      .filter(device => device.name === name)
      .sort((left, right) => Number(left.state === 'Booted') - Number(right.state === 'Booted')
        || left.platformVersion.localeCompare(right.platformVersion, undefined, { numeric: true }))
      .at(-1);
  if (!chosen) {
    throw new Error(requestedUdid
      ? `No available simulator with IOS_UDID=${requestedUdid}.`
      : `No available simulator named "${name}". Set IOS_DEVICE_NAME from \`xcrun simctl list devices available\`.`);
  }
  return chosen;
}

export function iosCapabilities(env: NodeJS.ProcessEnv = process.env) {
  const simulator = selectIosSimulator(env);
  return [{
    platformName: 'iOS', 'appium:automationName': 'XCUITest',
    'appium:app': localIosApp(env), 'appium:bundleId': 'com.saucelabs.mydemo.app.ios',
    'appium:deviceName': simulator.name, 'appium:udid': simulator.udid,
    'appium:platformVersion': simulator.platformVersion,
    // fullReset shuts down and erases the simulator. noReset false still removes and reinstalls the app.
    'appium:noReset': false, 'appium:fullReset': false,
    'appium:connectHardwareKeyboard': true,
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
