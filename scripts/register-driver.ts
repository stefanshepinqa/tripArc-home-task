import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const env = { ...process.env, APPIUM_HOME: resolve(process.env.APPIUM_HOME || '.appium') };
const appium = resolve('node_modules/appium/index.js');
const listed = spawnSync(process.execPath, [appium, 'driver', 'list', '--installed', '--json'], { env, encoding: 'utf8' });
if (listed.status !== 0) throw new Error('Could not inspect installed Appium drivers');
const installed = JSON.parse(listed.stdout) as Record<string, unknown>;
for (const driver of ['uiautomator2', 'xcuitest']) {
  if (installed[driver]) console.log(`Project ${driver} driver already registered`);
  else {
    const result = spawnSync(process.execPath, [appium, 'driver', 'install', '--source=dev', driver], { env, stdio: 'inherit' });
    if (result.status !== 0) process.exitCode = 1;
  }
}
