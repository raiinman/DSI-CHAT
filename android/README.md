# Original DSI Android adapter

Two native deliverables are implemented: **DSI Native Lab**, a development APK with native views, persistent settings and diagnostics; and an **original non-root bootstrap/patcher** for explicit local monolithic APKs or supported configuration APK sets. Neither uses a WebView. The locked Copperlight messenger is unchanged.

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
powershell -NoProfile -ExecutionPolicy Bypass -File android/build-split-fixture.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File android/set-test.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File android/export-test.ps1
node --test android/qa-preflight.test.mjs
```

`-Sdk <path>` and `-JavaHome <path>` override environment variables. Process-only `ExecutionPolicy Bypass` lets these checked-in scripts run without changing machine policy. Build outputs live in `dist/android`; temporary files/debug signing key stay in `.cache`. Java 26.0.2 was used locally; its obsolete Java 8/deprecated API/native-access warnings did not prevent compilation, dexing or APK signature verification.

Native Lab: `dist/android/dsi-native-lab-debug.apk`, package `interactive.deadsignal.dsi.devhost`, min SDK 26, target SDK 35, version 0.1.0, explicitly `testOnly`. `build-report.json` records hashes and scope. The APK has no network permission and does not read accounts/messages/tokens. Development installation requires ADB `-t`; QA supplies it automatically.

## Non-root local patching

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File android/patch-apk.ps1 `
  -InputApk "C:\explicitly-selected\owned-app.apk" `
  -OutputApk "C:\explicitly-selected\owned-app-dsi-debug.apk"
```

This one-file entry requires a monolithic APK declaring minimum SDK 26 or newer. APKS/XAPK containers and split-required bases are rejected here; use the validated set entry below for installed configuration splits. Shared-UID apps, missing/duplicated Application classes, unsupported Application.onCreate methods and already-patched namespaces are rejected. Protected/obfuscated/vendor-specific bootstraps can require another original adapter. No APK is downloaded by the patcher.

Apktool decodes/rebuilds the selected input. DSI authors the smali insertion: immediately after its Application.onCreate superclass call, invoke the original DSI Bootstrap.install. Existing method instructions remain. An Application without its own onCreate gets an override calling the original superclass; a default Application uses DSI's original BootstrapApplication. The original DSI bootstrap DEX is added as a separate classesN.dex. Native libraries use 16 KiB ZIP alignment. A separate output is development-signed, verified and accompanied by input/output/bootstrap SHA-256 metadata. Existing output files and the input are never overwritten; no installation follows patching.

**The original APK signing identity is not retained.** A patched package cannot update an officially signed installed app, and signature-dependent integrations/integrity checks may stop working. The tool does not uninstall apps, move account data, evade integrity checks or claim official compatibility. Production signing and real-client/device acceptance remain separate gates.

The injected DSI button opens native settings. Three original native handlers enlarge visible Android TextViews by 15%, reduce their extra line spacing, and disable Activity window animation styles. Safe mode reverses owned changes while retaining saved choices. Values persist under `dsi.injected.settings.v1`; native lab settings use a separate `dsi.native.settings.v1` record. `discord.runtime` and `browser.styles` remain unavailable. These handlers are native equivalents, not the shared browser CSS plugin implementation.

## Export your installed APK set and patch locally

Get Discord from the [official Google Play listing](https://play.google.com/store/apps/details?id=com.discord). On a phone you control, enable USB debugging, connect it and explicitly authorize your computer. Choose the serial from ADB's device listing. The following command reads only the selected installed package's APK files:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File android/export-apks.ps1 `
  -Serial "YOUR-EXPLICIT-ADB-SERIAL" -Package com.discord `
  -OutputDirectory "C:\selected\discord-installed-apks"
```

Pass `-Adb <adb.exe-path>` if the SDK/environment path is not configured. Export runs `adb -s <serial> get-state`, `shell pm path <package>` and `pull` for every validated APK path into a new folder. It does not pair/connect devices, install/uninstall packages, log into Discord or read app/account data. `export-report.json` records the complete installed-path inventory and SHA-256 of every exported APK. Existing output directories are refused.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File android/patch-set.ps1 `
  -InputDirectory "C:\selected\discord-installed-apks" `
  -OutputDirectory "C:\selected\discord-dsi-development-apks"
```

The set entry verifies one base, unique split names, matching package/version/signer, declared split dependencies/types and the export inventory when present. It supports base configuration/resource/native-library splits. Feature splits, splits containing DEX, non-base-dependent splits, missing declared dependencies/types, changed/incomplete export inventories and certificate/version/package mismatches are rejected before creating output. An arbitrary directory's completeness can only be checked against declared dependencies/types; missing unreferenced ABI/density/language configuration APKs cannot be determined from those checks alone. Export the entire installed set to retain the additional inventory check. The output report explicitly distinguishes a matching complete exported-path inventory from declared-requirements-only validation; the CLI reports the latter limitation when no inventory exists.

The original shared patch core inserts the base bootstrap while retaining split-required manifest metadata. All configuration splits are aligned and signed with the same local development key. Input hashes and output package/version/signer/split/dependency metadata are rechecked. `patch-set-report.json` records every input/output hash and signing boundary. No automatic installation follows. A complete set must be installed together with `adb install-multiple`, not by opening base.apk alone; replacement of an officially signed app/data is not automated or authorized by export/patching.

Controlled split fixtures are generated from DSI's original native source/resources using AAPT2's split output, not a third-party APK. `build-split-fixture.ps1` writes `dist/android/split-fixture`; patch it into a new `dist/android/split-fixture-patched` directory using the same set command. Output directories are deliberately not overwritten; use a fresh checkout/output for repeat fixture packaging.

## Verify on an emulator

Install the API 35 Google APIs x86_64 image and emulator with official Android CLI. Start a development AVD with working acceleration. Then run:

```sh
node android/emulator-qa.mjs --adb <adb-path> --serial emulator-5554 --apk dist/android/dsi-native-lab-patched-debug.apk --output .cache/android-emulator-evidence
node android/emulator-qa.mjs --adb <adb-path> --serial emulator-5554 --apk-set dist/android/split-fixture-patched --output .cache/android-emulator-evidence/splits
```

This script refuses physical-device serials and preflights every package plus base testOnly metadata through AAPT2 **before installation**. Set ANDROID_HOME/ANDROID_SDK_ROOT or pass `--aapt2 <path>`. It installs only the controlled DSI fixture (install-multiple for splits), verifies original Application and injected bootstrap logs, opens real native settings, toggles all three native handlers, checks safe-mode/reload persistence and saves XML/screenshots/logs. It never installs a user APK or touches Discord. Inspect screenshots before publication.

Local lifecycle acceptance passed 17 assertions. APK patch acceptance passed input preservation, original superclass/behavior, added DEX, default Application, duplicate-patch/output, bundle/split and missing-Application rejection. Both original and patched APKs passed v2/v3 signature verification. Local emulator 37.2.12/API35 software emulation did not boot: hardware virtualization is disabled in firmware and no hypervisor driver exists. Ubuntu API35 emulator run [37127639962](https://github.com/raiinman/DSI-CHAT/actions/runs/37127639962) passed original Application/bootstrap, three native toggles, safe mode and reload persistence after the dialog-action resource-ID fix. Native captures were inspected. A status-bar readability defect remained in that source: the newer Native Lab theme and API30+ WindowInsetsController explicitly request dark icons; updated rendered verification and split install-multiple QA remain pending. Native settings content scrolls. Additional local acceptance passed read-only export with a mock, complete split fixture/inventory with mismatch rejection, and two preflight tests proving foreign/non-test-only APKs never reach ADB. Build/signature checks alone are not runtime proof.

## Provenance and dependencies

DSI authors all Java handlers, engine, Activity, original Application fixture, bootstrap hook/patch workflow and tests. No Vencord, Equicord or Vendetta source/assets/loaders were imported. `plugins.json` records API 1 Android handler descriptors; manifest metadata alone never executes code.

Build/patch tools are development dependencies, not shipped runtime engines:

- Android platform 35/build-tools 35.0.1, emulator 37.2.12 and API35 Google APIs x86_64 revision 9: official Google SDK packages, retaining their packaged notices/license terms in the SDK. See [SDK tools](https://developer.android.com/tools), [AAPT2](https://developer.android.com/tools/aapt2), [D8](https://developer.android.com/tools/d8) and [apksigner](https://developer.android.com/tools/apksigner).
- [Apktool 3.0.3](https://github.com/iBotPeaches/Apktool/releases/tag/v3.0.3), Apache-2.0, copyright Ryszard Wiśniewski and Connor Tumbleson. `tooling.lock.json` pins the official JAR URL, size and release SHA-256. Its embedded Smali/Baksmali 3.0.9-dev and other libraries retain their notices inside the downloaded JAR. The JAR is not vendored or shipped in the DSI APK.
- Local Oracle JDK 26.0.2 supplies compiler/JAR/keytool; it is not bundled in Android outputs.

Android's [application sandbox](https://source.android.com/docs/security/app-sandbox) isolates apps by UID/process and applies to native code. A separate app cannot inject into ordinary stock Discord. Repackaging is the selected non-root development bootstrap path; actual host compatibility must be established from an explicitly supplied APK and controlled testing, separately from this fixture.
