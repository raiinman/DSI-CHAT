# Original DSI Android adapter

Two native deliverables are implemented: **DSI Native Lab**, a development APK with native views, persistent settings and diagnostics; and an **original non-root bootstrap/patcher** for an explicitly supplied local monolithic APK. Neither uses a WebView. The locked Copperlight messenger is unchanged.

The patcher has been validated against DSI's own controlled native fixture. Actual Discord Android attachment is **unverified**: no Discord APK or account was used. Generic Android TextView and window effects do not provide React Native module discovery, private Discord services or upstream plugin compatibility.

## Build on Windows

Use Node 24+, a JDK supporting `javac --release 8`, official Android platform 35/build-tools 35.0.1 and command-line tools. Set `ANDROID_HOME` and `JAVA_HOME` for the current process; no system PATH change is necessary. Existing portable SDK tools can be reused.

With Android command-line tools 23, install packages through `android.exe --sdk <SDK-path> sdk install "platforms;android-35" "build-tools;35.0.1"`. The old sdkmanager wrapper now delegates to Android CLI; use the new CLI to preserve package identifiers containing semicolons.

```powershell
node android/setup.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File android/test.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File android/build.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File android/build-bootstrap.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File android/patch-test.ps1
```

`-Sdk <path>` and `-JavaHome <path>` override environment variables. Process-only `ExecutionPolicy Bypass` lets these checked-in scripts run without changing machine policy. Build outputs live in `dist/android`; temporary files/debug signing key stay in `.cache`. Java 26.0.2 was used locally; its obsolete Java 8/deprecated API/native-access warnings did not prevent compilation, dexing or APK signature verification.

Native Lab: `dist/android/dsi-native-lab-debug.apk`, package `interactive.deadsignal.dsi.devhost`, min SDK 26, target SDK 35, version 0.1.0. `build-report.json` records hashes and scope. The APK has no network permission and does not read accounts/messages/tokens.

## Non-root local patching

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File android/patch-apk.ps1 `
  -InputApk "C:\explicitly-selected\owned-app.apk" `
  -OutputApk "C:\explicitly-selected\owned-app-dsi-debug.apk"
```

The input must be a single monolithic APK declaring minimum SDK 26 or newer. APKS/XAPK bundles, split-required APKs, shared-UID apps, missing/duplicated Application classes, unsupported Application.onCreate methods and already-patched namespaces are rejected. Protected/obfuscated/vendor-specific bootstraps can require another original adapter. No APK is downloaded by the patcher.

Apktool decodes/rebuilds the selected input. DSI authors the smali insertion: immediately after its Application.onCreate superclass call, invoke the original DSI Bootstrap.install. Existing method instructions remain. An Application without its own onCreate gets an override calling the original superclass; a default Application uses DSI's original BootstrapApplication. The original DSI bootstrap DEX is added as a separate classesN.dex. Native libraries use 16 KiB ZIP alignment. A separate output is development-signed, verified and accompanied by input/output/bootstrap SHA-256 metadata. Existing output files and the input are never overwritten; no installation follows patching.

**The original APK signing identity is not retained.** A patched package cannot update an officially signed installed app, and signature-dependent integrations/integrity checks may stop working. The tool does not uninstall apps, move account data, evade integrity checks or claim official compatibility. Production signing and real-client/device acceptance remain separate gates.

The injected DSI button opens native settings. Three original native handlers enlarge visible Android TextViews by 15%, reduce their extra line spacing, and disable Activity window animation styles. Safe mode reverses owned changes while retaining saved choices. Values persist under `dsi.injected.settings.v1`; native lab settings use a separate `dsi.native.settings.v1` record. `discord.runtime` and `browser.styles` remain unavailable. These handlers are native equivalents, not the shared browser CSS plugin implementation.

## Verify on an emulator

Install the API 35 Google APIs x86_64 image and emulator with official Android CLI. Start a development AVD with working acceleration. Then run:

```sh
node android/emulator-qa.mjs --adb <adb-path> --serial emulator-5554 --apk dist/android/dsi-native-lab-patched-debug.apk --output .cache/android-emulator-evidence
```

This script refuses physical-device serials, installs only the controlled DSI fixture, verifies original Application and injected bootstrap logs, opens real native settings, toggles all three native handlers, checks safe-mode/reload persistence and saves XML/screenshots/logs. It never installs a user APK or touches Discord. Inspect screenshots before publication.

Local lifecycle acceptance passed 17 assertions. APK patch acceptance passed input preservation, original superclass/behavior, added DEX, default Application, duplicate-patch/output, bundle/split and missing-Application rejection. Both original and patched APKs passed v2/v3 signature verification. Local emulator 37.2.12/API35 software emulation did not boot: hardware virtualization is disabled in firmware and no hypervisor driver exists. Runtime controls/screenshots still require a working emulator runner; build/signature checks are not runtime proof.

## Provenance and dependencies

DSI authors all Java handlers, engine, Activity, original Application fixture, bootstrap hook/patch workflow and tests. No Vencord, Equicord or Vendetta source/assets/loaders were imported. `plugins.json` records API 1 Android handler descriptors; manifest metadata alone never executes code.

Build/patch tools are development dependencies, not shipped runtime engines:

- Android platform 35/build-tools 35.0.1, emulator 37.2.12 and API35 Google APIs x86_64 revision 9: official Google SDK packages, retaining their packaged notices/license terms in the SDK. See [SDK tools](https://developer.android.com/tools), [AAPT2](https://developer.android.com/tools/aapt2), [D8](https://developer.android.com/tools/d8) and [apksigner](https://developer.android.com/tools/apksigner).
- [Apktool 3.0.3](https://github.com/iBotPeaches/Apktool/releases/tag/v3.0.3), Apache-2.0, copyright Ryszard Wiśniewski and Connor Tumbleson. `tooling.lock.json` pins the official JAR URL, size and release SHA-256. Its embedded Smali/Baksmali 3.0.9-dev and other libraries retain their notices inside the downloaded JAR. The JAR is not vendored or shipped in the DSI APK.
- Local Oracle JDK 26.0.2 supplies compiler/JAR/keytool; it is not bundled in Android outputs.

Android's [application sandbox](https://source.android.com/docs/security/app-sandbox) isolates apps by UID/process and applies to native code. A separate app cannot inject into ordinary stock Discord. Repackaging is the selected non-root development bootstrap path; actual host compatibility must be established from an explicitly supplied APK and controlled testing, separately from this fixture.
