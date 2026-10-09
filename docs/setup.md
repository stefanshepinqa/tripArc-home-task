# Environment setup

## On this Mac

Codex prepared Java and Android tools beneath ignored `.tools/`, plus pinned apps under ignored `apps/`. From the repository root:

```sh
. scripts/local-env.sh
npm run appium:setup
emulator -list-avds
emulator -avd triparc-1 -port 5554 -no-snapshot -no-boot-anim
```

Leave that terminal open. In another terminal, source the same environment and run `adb devices`, `npm run doctor`, then `npm run test:android`. WDIO owns the Appium process.

Both `triparc-1` and `triparc-2` were created during validation and stopped afterward. Start them on ports 5554 and 5556 to repeat the parallel run.

The environment script keeps AVDs and Android user settings within this project. If an emulator cannot launch inside a restricted shell, launch it from your normal terminal; hardware acceleration must be available.

## Clean machine

1. Install Node **24.11.0** (see `.nvmrc`) and a Java **17** JDK.
2. Install Android Studio or Google's command-line tools. Install platform-tools, emulator, Android API 34, build-tools 34.0.0, and an API 34 Google APIs system image matching the host: ARM64 on Apple Silicon, x86_64 on Linux/Intel.
3. Review/accept Android SDK licenses through the SDK manager. Set `JAVA_HOME`, `ANDROID_HOME`, and add SDK `platform-tools`, `emulator`, and `cmdline-tools/latest/bin` to `PATH`.
4. Create an AVD, boot it, and wait for `adb shell getprop sys.boot_completed` to return `1`.
5. Follow the README quick start. `npm ci` installs pinned Appium and driver packages; `npm run appium:setup` registers the local driver in ignored `.appium/`.

The Appium server listens on loopback only. Keep it local; the toolchain contains upstream dependency advisories. Run `npm audit` when maintaining dependencies and review compatible fixes with a real device regression run.

## Second emulator

Create a distinct AVD, not a second instance sharing the first AVD's writable storage:

```sh
. scripts/local-env.sh
avdmanager create avd --name triparc-2 --package 'system-images;android-34;google_apis;arm64-v8a' --device pixel_6
emulator -avd triparc-2 -port 5556 -no-snapshot -no-boot-anim
```

Set `ANDROID_UDIDS=emulator-5554,emulator-5556` in `.env`. Confirm both are online with `adb devices`, then run `npm run test:parallel`.

## iOS Simulator

Command Line Tools cannot boot a Simulator. Install Xcode, then point the active developer directory at it:

```sh
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

From the repository root:

```sh
npm run apps:download -- ios-sim
npm run appium:setup
xcrun simctl list devices available
npm run doctor -- --ios
npm run test:ios
```

`npm run apps:download -- ios-sim` verifies `SauceLabs-Demo-App.Simulator.zip` and extracts `apps/My Demo App.app`. The IPA from `apps:download -- ios` is the real-device build and cannot be installed on a Simulator.

Set `IOS_DEVICE_NAME` in `.env` to one of the listed devices, such as `iPhone 16`. Appium boots that simulator when `IOS_UDID` is empty. To pin a simulator that is already booted, set `IOS_UDID` to its UUID from `xcrun simctl list devices booted`. The pinned app needs an iOS 16.6 or newer runtime. The first session compiles WebDriverAgent into `.appium/wda` and can take several minutes. Later sessions reuse that build.

Open the Simulator window yourself with `open -a Simulator` if you want to watch the run. Do not start another Appium server on port 4723, and do not run the Android suite against the same port at the same time.

## Troubleshooting

- Missing APK: `npm run apps:download -- android`; downloads verify pinned SHA-256 digests.
- Missing driver: `npm run appium:setup` using the same `APPIUM_HOME` as the test runner.
- Unauthorized/offline device: inspect `adb devices`; unlock/authorize physical devices or wait for emulator boot.
- Port 4723 in use: stop the other Appium process before running WDIO.
- Allure cannot find Java: set `JAVA_HOME` or source the project environment script.
- `xcodebuild` says the active developer directory is Command Line Tools: install Xcode and run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- Simulator app missing: `npm run apps:download -- ios-sim`. Do not point `IOS_APP_PATH` at the IPA.
- Named simulator missing: set `IOS_DEVICE_NAME` to a device from `xcrun simctl list devices available`.
- iOS cloud session cannot start: verify the Sauce Labs data center, uploaded `storage:` id, and a real device/OS pair from that account before changing the business test. Sauce Labs re-signs the IPA.
