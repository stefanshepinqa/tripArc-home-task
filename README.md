# TripArc native mobile automation

Appium + WebdriverIO + TypeScript, with a strict Page Object Model for Sauce Labs' **native** Android and iOS My Demo Apps (2.3.0).

**Validation status:** see [execution evidence](docs/validation.md). Implemented configuration is not evidence of a successful device run. Cloud runs require your own Sauce Labs Real Device Cloud account.

## Quick start

Use Node 24.11.0, Java 17, an Android SDK with API 34, and a booted Android emulator. Full instructions: [setup](docs/setup.md).

```sh
npm ci
cp .env.example .env
npm run apps:download -- android
npm run appium:setup
npm run doctor
npm run check
npm run test:android
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
| `npm run verify:stability -- 3` | Consecutive local suite runs; stop on first failure |
| `npm run verify:artifacts` | Opt-in intentional failure; require nonzero test exit plus screenshot/source |
| `npm run report` | Generate standalone Allure HTML report; requires Java |

Run a single scenario with `npm run test:android -- --spec tests/specs/cart.spec.ts`.

Local iOS uses the same specs. Install full Xcode, then:

```sh
npm run apps:download -- ios-sim
npm run appium:setup
npm run doctor -- --ios
npm run test:ios
```

`apps:download -- ios` still fetches the device IPA for Sauce Labs. Simulator sessions use `SauceLabs-Demo-App.Simulator.zip`, extracted to `apps/My Demo App.app`. Set `IOS_DEVICE_NAME` to a simulator from `xcrun simctl list devices available`. Leave `IOS_UDID` empty and Appium boots that simulator. Do not run `test:ios` and `test:android` at the same time; both use Appium on port 4723.

## Test strategy and architecture

```text
tests/specs/       Business steps, fixture selection, and assertions only
src/pages/        Eight page objects: interactions, readiness, domain values
src/locators/     Private platform-specific locator maps and strategy resolver
src/helpers/      Device, fixtures, API setup, session, upload, money, artifacts
src/data/         Typed, fixed expected product and checkout fixtures
config/           Shared WDIO settings, capabilities, pinned app manifest
scripts/          Setup checks, downloads, uploads, verification commands
```

Business specs never call the driver, contain selectors, implement reusable functions, or branch by platform. ESLint enforces these boundaries. Page objects do not conceal business assertions: they expose actions and typed values; specs state the expected outcome. Device gestures and lifecycle handling live in `DeviceHelper`.

Each spec contains **one independent scenario**. WDIO creates a new session per spec. Local Android and iOS use `noReset: false` and `fullReset: true` for a clean reinstall. Sauce Labs real-device sessions use `noReset: false`. Adding multiple tests to one spec would require explicit state reset between them; do not assume the existing hook resets application data.

| Scenario | Meaningful assertions |
| --- | --- |
| Purchase | Exact product, quantity, unit price, subtotal, review total including $5.99 delivery, completion |
| Cart quantity | 1 → 2 → 1, exact subtotal updates, unchanged product identity and unit price |
| Shipping validation | Specific missing-name feedback, no navigation on invalid input, successful recovery to payment |
| Lifecycle | Expected cart values before and after background/reactivation |

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
3. Run the commands below and copy each returned `storage:<id>` into `.env`.

```sh
npm run apps:download -- all
npm run cloud:upload -- android
npm run cloud:upload -- ios
npm run test:cloud:android
npm run test:cloud:ios
```

The upload helper uses the Sauce Labs File Storage API. It is infrastructure setup, not app business-data setup. Cloud sessions include build metadata and an explicit pass/fail job result. No local Appium server or iOS signing setup is needed for cloud execution; Sauce Labs re-signs the official IPA for the real device. A Linux cloud CI job can run iOS tests because the device and XCUITest server are remote.

## Parallelism, artifacts, and CI

Set `ANDROID_UDIDS=emulator-5554,emulator-5556` after booting two independent AVDs. Specs are partitioned into disjoint groups, with one session per device and separate UiAutomator2/MJPEG ports. Artifact names include the worker/process identity. Do not run the serial and parallel commands simultaneously against the same devices.

Failures capture screenshots, XML page source, session metadata, and device logs where supported. Screenshot collection failures do not discard source/logs or replace the original assertion. Unsupported iOS/cloud log commands are recorded in the capture manifest. Reports are under `artifacts/`: JUnit for CI, Allure for review, and WDIO/Appium logs for diagnosis. App source/screenshots contain test input; use synthetic fixtures and avoid committing raw outputs.

The opt-in intentional-failure diagnostic writes to `artifacts/diagnostics/`, keeping its expected failure out of normal suite reports. `ARTIFACTS_DIR` can isolate output for other runs.

GitHub Actions includes static checks, Android emulator execution on Linux, and manually triggered Android/iOS cloud jobs. Add `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` repository secrets before dispatching cloud jobs. Set the `SAUCE_REGION` repository variable when the account is not in `us-west-1`. CI uploads artifacts on failure as well as success; it does not publish a site or reports publicly.

## API setup extension

`ApiSetupProvider` defines typed setup/cleanup methods. The default returns `status: 'not-configured'` and creates no fixture IDs. `ApiSetupHelper` accepts a future real adapter and passes created fixture IDs to cleanup. Native product/cart/checkout data in the inspected source is local; no business setup API is claimed. If a genuine endpoint is verified later, implement an adapter with authentication, bounded timeouts, unique run data, and cleanup, then inject it into the session helper.

## Submission and walkthrough

Use the [Friday stages](docs/stages.md), [validation record](docs/validation.md), and [decision notes](docs/decisions.md). This follows the requested expanded plan rather than a controlled two-hour exercise. Record actual effort and do not claim timed compliance or unexecuted runs as completed evidence.

Before submission, verify a clean checkout, repeat the suite, check failure diagnostics, and publish a public GitHub repository without `.env`, app binaries, or generated reports. Attach real CI/cloud evidence and a short demonstration. Public repository publication is a separate final step once a destination/account is available.
