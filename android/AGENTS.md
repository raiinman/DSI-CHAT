# Native Android development host

## Purpose

Own DSI's original native Android adapter development APK and reproducible SDK build/test commands.

## Ownership

- `src/`, `res/`: native Activity/fixture Application, capability-gated lifecycle and local settings.
- `bootstrap/`, `plugins.json`: original non-root native loader/handlers and API 1 descriptors.
- `tests/`: plain-Java lifecycle acceptance tests.
- `AndroidManifest.xml`: native development application; no account/network permissions.
- `build.ps1`, `build-bootstrap.ps1`, `build-split-fixture.ps1`, `test.ps1`, `patch-test.ps1`, `set-test.ps1`, `export-test.ps1`, `qa-preflight.test.mjs`, `emulator-qa.mjs`: local builds and monolithic/split fixture verification.
- `setup.mjs`, `tooling.lock.json`, `tools.ps1`, `apk-info.ps1`: pinned development tooling and native metadata inspection.
- `export-apks.ps1`: explicit selected-device read-only installed APK export; no account data or install/connect commands.
- `patch-apk.ps1`, `patch-core.ps1`, `patch-set.ps1`: monolithic/split entry points and shared original bootstrap patching.
- `README.md`: build, testing, platform support and dependency notices.
- `manager/`: original phone-only Manager, verified native installer and DSI updater; see child instructions.
- `manager-qa.mjs`, `manager-qa-preflight.test.mjs`: controlled Manager/demo installation and preflight acceptance.

## Local Contracts

- This is a native Java development host, not a WebView and not an attached Discord Android client.
- Only reviewed built-in handlers execute. Manifest capabilities must match actual native services; unavailable Discord runtime capabilities stay disabled.
- The user selected ordinary non-root Android. Patch only explicit local APK inputs into new development-signed outputs; input and existing outputs remain intact. APK-set support validates package/version/certificate, manifest dependencies/types and supplied export inventory. Only base configuration/resource/native-library splits are supported; feature/code/non-base-dependent splits remain rejected.
- Export only APK paths reported by package manager for an explicitly selected, already authorized ADB serial/package. Never download/distribute Discord APKs, read account data or automatically connect/install into a user device/client.
- Emulator QA preflights every APK package and base testOnly metadata before installation, then checks the target is an emulator. It installs only DSI's controlled fixture with install/install-multiple, never user APK inputs.
- Preserve enabled choices in safe mode. Clean up native effects when stopped; contain lifecycle failures and report diagnostics.
- Keep SDK, APK intermediates, emulator state and debug signing keys under ignored repository `.cache/` or `dist/`; never embed production signing credentials in source. The public Android debug-key password is development-only.
- Use official pinned Android SDK platform/build tools and existing JDK. Debug signing is development-only, not a production signing identity.

## Work Guidance

Use the shared DSI API version 1 manifest fields and explicit Android capability reports. Native host handlers do not execute JavaScript plugins or promise browser CSS compatibility. Do not change the locked messenger UI.

Native settings content scrolls on short screens/large fonts. The Native Lab uses dark system-bar icons on its light surfaces. Emulator QA locates standard dialog actions by Android resource IDs, preserving uppercase/localized button rendering.

## Verification

Run `android/test.ps1`, `build.ps1`, `build-bootstrap.ps1`, `patch-test.ps1`, `build-split-fixture.ps1`, `set-test.ps1` and `export-test.ps1` with the process-only execution policy documented in README. Run `node --test android/qa-preflight.test.mjs` with ANDROID_HOME set; it verifies foreign/non-test-only fixtures cannot reach ADB. Build a patched set with `patch-set.ps1`. Emulator QA accepts `--apk` or `--apk-set`; inspect both monolithic/split captures and record actual results. APK verification includes apksigner and manifest inspection. Export acceptance uses a local ADB mock and does not contact a device. Real Discord attachment and physical-device support require separate evidence.

Manager HTTPS adversarial acceptance appends `--red-team` to the controlled `manager-qa.mjs` command. It checks malformed/oversize feeds, wrong package/archive version/declared size, HTTP failure, hostile URL and unsupported SDK; rejected updates must leave no staged bytes or installer session, and metadata failures must fetch no APK. It also checks cached-failure restart persistence, cancellation/retry, compiled nonexported receiver flags and unchanged private journals after forged owned/nonowned session results before the normal approved update. Use only the compile-time QA Manager, reviewed same-package update fixtures and scoped localhost test certificate; report actual emulator results separately from local preflight.

## Child DOX Index

- [manager/AGENTS.md](manager/AGENTS.md): guided native installer, trusted DSI update flow and controlled sample boundary.
