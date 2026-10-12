# TripArc native mobile automation

Appium + WebdriverIO + TypeScript, with a strict Page Object Model for Sauce Labs' **native** Android and iOS My Demo Apps (2.3.0).

## Quick start

Use Node 24.11.0, Java 17, and either an Android SDK with API 34 or full Xcode for iOS. Full instructions: [setup](docs/setup.md).

### Android

1. Download the [Sauce Labs My Demo App APK v2.3.0](https://github.com/nickmichalak/my-demo-app-android/releases/download/2.3.0/mda-2.3.0-27.apk) and place it in `apps/mda-2.3.0-27.apk`.

```sh
npm ci
cp .env.example .env
npx appium driver install --source=dev uiautomator2
npm run check
npm run test:android
```

### iOS (macOS only)

1. Download the [Sauce Labs My Demo App iOS Simulator build v2.3.0](https://github.com/nickmichalak/my-demo-app-ios/releases/download/2.3.0/SauceLabs-Demo-App.Simulator.zip), unzip it, and place `My Demo App.app` in `apps/My Demo App.app`.

```sh
npm ci
cp .env.example .env
npx appium driver install --source=dev xcuitest
npm run check
npm run test:ios
```

Appium is launched and stopped by WDIO. Do not start a second server on port 4723. If using the project-local toolchain prepared on this machine, first run `. scripts/local-env.sh` from the project root.

| Command | Purpose |
| --- | --- |
| `npm run check` | TypeScript and architecture lint rules |
| `npm run test:android` | Four independent Android scenarios on a booted emulator |
| `npm run test:ios` | Same scenarios on a local iOS Simulator |
| `npm run test:parallel` | Partition the four specs across two booted Android emulators |
| `npm run test:cloud:android` | Same business specs on a Sauce Labs Android device |
| `npm run test:cloud:ios` | Same business specs on a Sauce Labs iOS device |
| `npm run report` | Generate standalone Allure HTML report; requires Java |
| `npm run report:open` | Open the generated Allure report in a browser |

Run a single scenario with `npm run test:android -- --spec tests/specs/cart.spec.ts`.

Set `IOS_DEVICE_NAME` to a simulator from `xcrun simctl list devices available`. The suite reuses that simulator across specs. Do not run `test:ios` and `test:android` at the same time; both use Appium on port 4723.

## Test strategy and architecture

```text
tests/specs/       Business steps, fixture selection, and assertions only
src/pages/        Eight page objects: interactions, readiness, domain values
src/locators/     Private platform-specific locator maps and strategy resolver
src/helpers/      Device, fixtures, session, money, artifacts
src/data/         Typed, fixed expected product and checkout fixtures
config/           Shared WDIO settings, capabilities, environment
scripts/          Local environment helpers
```

Business specs never call the driver, contain selectors, implement reusable functions, or branch by platform. ESLint enforces these boundaries. Page objects do not conceal business assertions: they expose actions and typed values; specs state the expected outcome. Device gestures and lifecycle handling live in `DeviceHelper`.

Each spec contains **one independent scenario**. WDIO creates a new session per spec. Local Android and iOS use `noReset: false` and `fullReset: false`: the emulator or simulator stays booted, and the app under test is uninstalled and reinstalled. Sauce Labs real-device sessions use `noReset: false`. Adding multiple tests to one spec would require explicit state reset between them; do not assume the existing hook resets application data.

| Scenario | Meaningful assertions |
| --- | --- |
| Purchase | Exact product, quantity, unit price, subtotal, review total including $5.99 delivery, completion |
| Cart quantity | 1 → 2 → 1, exact subtotal updates, unchanged product identity and unit price |
| Shipping validation | Specific missing-name feedback, no navigation on invalid input, successful recovery to payment |
| Lifecycle | Expected cart values after background/reactivation. iOS also rotates landscape and back to portrait. Android MainActivity is portrait-locked, so the test confirms that lock |

Money is compared in integer cents. Fixed expectations come from the pinned app's product data, rather than copying displayed values and using them as the only oracle. Demo payment data is synthetic; these apps do not process real purchases.

## Locators and platform differences

Prefer accessibility IDs, followed by Android resource IDs and iOS predicates. All selectors live in locator maps and are resolved inside pages. See the [source audit and exceptions](docs/locator-audit.md).

Concrete differences:

- Cart navigation: Android `cartIV` resource ID versus iOS `Cart-tab-item` accessibility ID.
- Shipping validation: Android inline text versus an iOS native alert, dismissed inside the page object.
- Capabilities: UiAutomator2 versus XCUITest; Android device identifiers/ports stay out of business tests.
- Native catalog data: Android `Sauce Labs Backpack`, iOS `Sauce Labs Backpack - Black`; the fixture helper selects the correct expected data.

Some iOS controls lack accessibility identifiers. Their scoped XPath/class-chain selectors are source-derived exceptions and need device-tree verification. Storyboard IDs are **not** usable accessibility IDs. iOS execution remains unverified until a real cloud run is recorded.

## Synchronization and flakiness

No arbitrary sleeps and no automatic test retries. Page objects wait for visible/enabled controls and screen transitions; the cart waits for each quantity update and exact expected subtotal. Helpers re-query after changes rather than retaining stale row elements. Scrolling is bounded and fails with a useful error.

As the suite grows: preserve isolated fixtures, use stable app-provided test IDs, scope repeated rows by product identity, classify infrastructure versus application failures, collect first-failure diagnostics, and track repeated-run failure rates. Quarantine only with an owner and a tracked fix. Do not hide defects with blanket retries. The current cart reader deliberately supports one product; extend row scoping before adding multi-product cases.

## Cloud execution

Sauce Labs Real Device Cloud concurrency and the devices in your data center must be confirmed in the account. This project runs cloud sessions serially.

1. Put `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, and `SAUCE_REGION` into `.env`. The region is the account data center: `us-west-1`, `us-east-4`, or `eu-central-1`.
2. Set device display names and OS versions from the account's real-device list. A major version such as `14` also matches incremental versions.
3. In Sauce Labs, open **App Management**, upload the Android APK and iOS IPA, then copy each file id into `.env` as `SAUCE_ANDROID_APP=storage:<uuid>` and `SAUCE_IOS_APP=storage:<uuid>`.
4. Run the cloud suites:

```sh
npm run test:cloud:android
npm run test:cloud:ios
```

Cloud sessions include build metadata and an explicit pass/fail job result. No local Appium server or iOS signing setup is needed; Sauce Labs re-signs the official IPA for the real device.

## Parallelism, artifacts, and CI

Set `ANDROID_UDIDS=emulator-5554,emulator-5556` after booting two independent AVDs. Specs are partitioned into disjoint groups, with one session per device and separate UiAutomator2/MJPEG ports. Artifact names include the worker/process identity. Do not run the serial and parallel commands simultaneously against the same devices.

Failures capture screenshots, XML page source, session metadata, and device logs where supported. Screenshot collection failures do not discard source/logs or replace the original assertion. Unsupported iOS/cloud log commands are recorded in the capture manifest. Reports are under `artifacts/`: JUnit for CI, Allure for review, and WDIO/Appium logs for diagnosis. App source/screenshots contain test input; use synthetic fixtures and avoid committing raw outputs.

The opt-in intentional-failure diagnostic writes to `artifacts/diagnostics/`, keeping its expected failure out of normal suite reports. `ARTIFACTS_DIR` can isolate output for other runs.

GitHub Actions includes static checks and Sauce Labs Android and iOS jobs on push and pull request (`.github/workflows/cicd.yml`). Add `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_ANDROID_APP`, and `SAUCE_IOS_APP` repository secrets (`storage:<uuid>` from App Management). Default devices are Samsung Galaxy A23 5G (OS 13) and iPhone 13 Pro (OS 18) in `us-west-1`; override with `SAUCE_ANDROID_DEVICE`, `SAUCE_ANDROID_OS`, `SAUCE_IOS_DEVICE`, `SAUCE_IOS_OS`, or `SAUCE_REGION` repository variables. CI uploads artifacts on failure as well as success; it does not publish a site or reports publicly.

## Submission and walkthrough

Use the [Friday stages](docs/stages.md) and [decision notes](docs/decisions.md).

Before submission, verify a clean checkout, repeat the suite, check failure diagnostics, and publish a public GitHub repository without `.env`, app binaries, or generated reports. Attach real CI/cloud evidence and a short demonstration.
