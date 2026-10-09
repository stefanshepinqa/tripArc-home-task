# Execution evidence

Validated Thursday, October 8, 2026 (America/Toronto). Codex performed source implementation, environment setup, and automated validation in this chat; this was not a supervised timed exercise. Test-run duration measurements below are separate from human preparation time.

## Implemented

- Eight page objects with abstracted Android/iOS locator maps.
- Four independent business scenarios; no driver/locator implementations in specs.
- Local serial/parallel and Sauce Labs Real Device Cloud Android/iOS configurations.
- Pinned native app downloads with SHA-256 verification; real cloud upload helper.
- JUnit, Allure, screenshot/source/session/log capture, and opt-in failure verification.
- GitHub Actions checks/emulator/cloud jobs and typed API extension structure.

## Verified during implementation

- TypeScript and ESLint checks passed.
- Official Android APK and iOS IPA 2.3.0 downloaded and checksums verified.
- Project-local Java/Android tools installed; UiAutomator2 driver registered.

## Device execution

Android 14 / API 34 / ARM64 on two Pixel 6 AVDs. Local tools: Node 24.11.0, Temurin 17.0.20.1, Appium 3.8.0, UiAutomator2 8.7.0, WebdriverIO 10.0.2.

- `npm run test:android`: all four scenarios passed (1m49s).
- `ANDROID_UDIDS=emulator-5554,emulator-5556 npm run test:parallel`: all four scenarios passed (1m18s), each spec executed once across two device workers.
- A clean source copy under `/tmp` passed `npm ci` and `npm run check`, with no app binaries or local tools copied into it. A literal Git clone remains to be checked after repository publication.
- The initial purchase run exposed Android's image-only catalog click handler. Its failure produced screenshot, source, device logs, and session metadata; the corrected flow subsequently passed.

- `npm run verify:stability -- 3`: **three consecutive complete suites passed**, retries disabled; measured durations 104.586s, 108.770s, and 105.357s. Exact UTC timestamps are preserved in `artifacts/stability.json`.
- `npm run verify:artifacts`: intentional assertion failure returned nonzero and captured nonempty screenshot/source plus logs/session metadata under `artifacts/diagnostics/failures/`. The temporary test file was removed afterward.
- `npm run report`: Allure HTML generated successfully at `artifacts/allure-report/index.html`; summary has no failures or broken tests. It aggregates serial/parallel device executions, so report entries are not a count of unique business scenarios (there are four).
- Final `npm run check`: TypeScript and ESLint passed.
- Both emulator processes were stopped after validation; AVDs and project-local tools remain ready for reuse.

| Acceptance gate | Status |
| --- | --- |
| Android purchase | Passed |
| Android cart, validation, lifecycle | Passed |
| Three/five consecutive local suites | Three passed; five-run gate reserved for final submission validation |
| Two emulator workers | Passed; disjoint spec groups and ports |
| Intentional failure screenshot/source | Passed; temporary failing spec removed |
| Sauce Labs Android/iOS | Pending account credentials and device availability |
| GitHub-hosted CI | Pending repository publication |
| Clean install from source copy | Passed; literal clone pending publication |

The local Git repository has been initialized on `main`. Ignore checks confirmed `.env`, SDK/JDK files, app binaries, Appium runtime state, and generated artifacts are excluded. No commit, remote publication, or GitHub-hosted workflow run is claimed.

iOS locators currently have source inspection, not runtime verification. The API setup bonus is an extension structure, not an implemented backend integration. Dependency audit findings remain in upstream automation tooling; Appium binds to loopback and dependency upgrades require regression validation.
