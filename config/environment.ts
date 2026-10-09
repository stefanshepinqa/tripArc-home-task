import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Platform } from '../src/types/domain.js';
process.env.APPIUM_HOME ||= resolve('.appium');
export const artifactRoot = resolve(process.env.ARTIFACTS_DIR || 'artifacts');

export function required(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; see .env.example`);
  return value;
}
export function localApp(env: NodeJS.ProcessEnv = process.env): string {
  const app = resolve(env.ANDROID_APP_PATH || 'apps/mda-2.3.0-27.apk');
  if (!existsSync(app)) throw new Error(`APK not found: ${app}. Run npm run apps:download -- android`);
  return app;
}
export function localIosApp(env: NodeJS.ProcessEnv = process.env): string {
  const app = resolve(env.IOS_APP_PATH || 'apps/My Demo App.app');
  if (app.endsWith('.ipa')) throw new Error(`Simulator sessions cannot install an IPA (${app}). Run npm run apps:download -- ios-sim`);
  if (!existsSync(app)) throw new Error(`Simulator app not found: ${app}. Run npm run apps:download -- ios-sim`);
  return app;
}
export function deviceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  const ids = (env.ANDROID_UDIDS || env.ANDROID_UDID || 'emulator-5554').split(',').map(x => x.trim());
  if (ids.some(x => !x) || new Set(ids).size !== ids.length) throw new Error('Android device IDs must be nonempty and unique');
  return ids;
}
const sauceStorage = /^storage:(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|filename=[^/\s]+)$/i;

export function cloudApp(platform: Platform, env: NodeJS.ProcessEnv = process.env): string {
  const app = required(platform === 'android' ? 'SAUCE_ANDROID_APP' : 'SAUCE_IOS_APP', env);
  if (!sauceStorage.test(app)) throw new Error('Cloud app must be a Sauce storage id (storage:<uuid>) or storage:filename=<name>');
  return app;
}
