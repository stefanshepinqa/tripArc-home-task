import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

let failed = false;
function check(label: string, good: boolean, detail = '') {
  console.log(`${good ? 'OK' : 'MISSING'} ${label}${detail ? `: ${detail}` : ''}`);
  if (!good) failed = true;
}
check('Node 22.19+ or 24+', Number(process.versions.node.split('.')[0]) >= 24 ||
  (Number(process.versions.node.split('.')[0]) === 22 && Number(process.versions.node.split('.')[1]) >= 19), process.version);
if (process.argv.includes('--cloud')) {
  for (const key of ['SAUCE_USERNAME', 'SAUCE_ACCESS_KEY']) check(key, Boolean(process.env[key]));
  check('Cloud apps uploaded', Boolean(process.env.SAUCE_ANDROID_APP && process.env.SAUCE_IOS_APP));
} else if (process.argv.includes('--ios')) {
  for (const command of [['xcodebuild', '-version'], ['xcrun', 'simctl', 'help']]) {
    const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' });
    const detail = result.status === 0 ? '' : (result.stderr || result.stdout || result.error?.message || '').split('\n')[0];
    check(command[0] === 'xcrun' ? 'simctl' : command[0], result.status === 0, detail);
  }
  check('Simulator app', existsSync(resolve(process.env.IOS_APP_PATH || 'apps/My Demo App.app')));
  const devices = spawnSync('xcrun', ['simctl', 'list', 'devices', 'available'], { encoding: 'utf8' });
  const wanted = process.env.IOS_DEVICE_NAME?.trim() || 'iPhone 16';
  check(`Simulator "${wanted}"`, (devices.stdout || '').includes(wanted));
} else {
  for (const command of [['java', '-version'], ['adb', 'version'], ['emulator', '-version']]) {
    const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8' });
    check(command[0], result.status === 0, result.error?.message);
  }
  check('Android SDK environment', Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT));
  check('APK', existsSync(resolve(process.env.ANDROID_APP_PATH || 'apps/mda-2.3.0-27.apk')));
  const devices = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  check('Connected Android device', /\S+\s+device\n/.test(devices.stdout || ''));
}
process.exitCode = failed ? 1 : 0;
