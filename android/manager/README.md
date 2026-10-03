# DSI Manager development preview

A native, phone-only installer and built-in updater. The first installer payload is DSI's own native sample app; actual Discord setup remains in development. The approved messenger stays unchanged.

## Normal user flow

Install the Manager APK once, open it and tap **Start guided setup**. The included app is checked privately. Android asks you to allow installations from DSI Manager, then confirm the install. Return to the Manager to open the sample. Cancellation and retry preserve existing apps/data; different-signer sample installations are refused. There is no file picker, ADB, USB/PC or SDK requirement in this flow.

**Check for updates** contacts the fixed DSI GitHub feed. A newer release is downloaded only on your action, verified and handed to Android for approval. Network failure is reported as failure, not up to date. Same-package updates preserve Manager preferences.

This preview does not install Discord, add mobile JavaScript plugin support or prove client compatibility. The sample exercises original native bootstrap controls. No Discord APK, account data or upstream loader is bundled or downloaded.

## Development build

Select SDK35/build-tools35.0.1 and a JDK; `node android/setup.mjs` verifies the pinned development patch tool. From repository root:

```powershell
./android/build.ps1 -Sdk $env:ANDROID_HOME -JavaHome $env:JAVA_HOME
./android/manager/build.ps1 -Sdk $env:ANDROID_HOME -JavaHome $env:JAVA_HOME
```

Outputs: `dist/android/dsi-manager-debug.apk`, matching `dsi-manager-demo-debug.apk` and `manager-build-report.json`. APKs are normal sideloadable packages (not testOnly), signed for development. A stable Manager key is retained at `.cache/android-manager/debug.keystore`. Keep this private key; future published Manager updates must reuse the same signing identity. Do not publish a CI-recreated debug key as a replacement release identity. Production key management/distribution remains a separate gate.

The builder internally uses original Java sources/bootstrap and the existing local patch workflow. It does not import an upstream loader. The sample embeds exact SHA-256, size, package, version, minimum SDK and signer metadata. Its package is `interactive.deadsignal.dsi.managerdemo`; Manager is `interactive.deadsignal.dsi.manager`.

Preserve the sample signer at `.cache/android-build/debug.keystore` as well. Regenerating it makes later sample payloads incompatible with an already installed sample; the Manager correctly refuses that replacement.

## Updater contract

Production endpoint: `https://raw.githubusercontent.com/raiinman/DSI-CHAT/codex/dsi-original/updates/manager.json`. Feed schema1 provides package, versionCode/versionName, minSdk, bytes, sha256, certificateSha256 and a DSI GitHub release APK URL. Check/download are bounded and off the UI thread. Downloads are private, size/hash verified and checked against package/version/SDK plus the currently installed Manager's signer. Rollbacks, unsupported URLs, different certificates and test-only update APKs are refused. System approval remains explicit; no uninstall or silent update occurs.

Owned installer sessions/results are persisted and reconciled on restart. Pending Android approval is launched only from the foreground Activity. Cancellation abandons only the recorded session and cleans only owned staging. Installer and updater have separate journals. Failed or cancelled update checks remain visible after restart; a cached feed does not turn a failed check into success. Interrupted operations do not imply completion. If the process stops after a session is created but before it is committed, use **Cancel setup** or **Cancel update**, then retry; this narrow precommit interval does not automatically resume.

## Controlled acceptance

`android/manager-qa-preflight.test.mjs` uses real SDK-compiled APKs and verifies exact package/hash/embedded-payload boundaries before ADB. Nine checks currently pass. `android/manager-qa.mjs` runs only after those gates and an emulator check; genuine permission/decline/install/open/relaunch/update acceptance and screenshot evidence are recorded in docs/STATE.md after actual execution.

Compile-time `-QaCertificate <local-test-CA>` builds a visibly named **DSI Manager QA** variant with a fixed `https://localhost:8443` fixture feed and CA scoped only to localhost. Production has no arbitrary feed override or QA CA. QA uses original same-signer version 3 and different-signer fixtures (the Manager baseline is version 2) to test HTTPS, rollback/certificate/hash rejection and actual PackageInstaller update approval. QA APKs, the dummy localhost TLS key and alternate signer fixtures must not be published as user downloads. Private signing keys never ship.

No external Java runtime libraries or copied upstream source are introduced. The Manager uses native Android APIs; the original launcher mark is an authored vector. Context7 supplied current native inset/installation documentation. Android/Apktool development notices remain in the parent README.
