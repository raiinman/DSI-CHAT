# Native Android development host

## Purpose

Own DSI's original native Android adapter development APK and reproducible SDK build/test commands.

## Ownership

- `src/`, `res/`: native Activity/fixture Application, capability-gated lifecycle and local settings.
- `bootstrap/`, `plugins.json`: original non-root native loader/handlers and API 1 descriptors.
- `tests/`: plain-Java lifecycle acceptance tests.
- `AndroidManifest.xml`: native development application; no account/network permissions.
- `build.ps1`, `build-bootstrap.ps1`, `test.ps1`, `patch-test.ps1`, `emulator-qa.mjs`: local builds and fixture verification.
- `setup.mjs`, `tooling.lock.json`, `tools.ps1`, `patch-apk.ps1`: pinned development tooling and explicit user-supplied APK patching.
- `README.md`: build, testing, platform support and dependency notices.

## Local Contracts

- This is a native Java development host, not a WebView and not an attached Discord Android client.
- Only reviewed built-in handlers execute. Manifest capabilities must match actual native services; unavailable Discord runtime capabilities stay disabled.
- The user selected ordinary non-root Android. Patch only an explicitly selected monolithic local APK into a separate development-signed output; input and existing outputs remain intact. Reject unsupported split/loader/signature boundaries. Never download/distribute Discord APKs or automatically install into a user's device/client. Emulator QA installs DSI's controlled fixture only.
- Preserve enabled choices in safe mode. Clean up native effects when stopped; contain lifecycle failures and report diagnostics.
- Keep SDK, APK intermediates, emulator state and debug signing keys under ignored repository `.cache/` or `dist/`; never embed production signing credentials in source. The public Android debug-key password is development-only.
- Use official pinned Android SDK platform/build tools and existing JDK. Debug signing is development-only, not a production signing identity.

## Work Guidance

Use the shared DSI API version 1 manifest fields and explicit Android capability reports. Native host handlers do not execute JavaScript plugins or promise browser CSS compatibility. Do not change the locked messenger UI.

Native settings content scrolls on short screens/large fonts. The Native Lab uses dark system-bar icons on its light surfaces. Emulator QA locates standard dialog actions by Android resource IDs, preserving uppercase/localized button rendering.

## Verification

Run `android/test.ps1`, `build.ps1`, `build-bootstrap.ps1` and `patch-test.ps1` with the process-only execution policy documented in README. When an emulator is available, run `android/emulator-qa.mjs`, inspect screenshots and record actual results. APK verification includes apksigner and manifest inspection. Real Discord attachment and physical-device support require separate evidence.

## Child DOX Index

No child documentation boundaries. Android sources/tests/tools are owned here; parent owns common engine and release documentation.
