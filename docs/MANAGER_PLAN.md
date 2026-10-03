# DSI Manager

The user authorized an original phone-only manager and explicitly requested a built-in updater. The normal flow should need one Manager APK, one setup action, and Android's required approval screens. No PC, ADB, manual APK selection or SDK steps belong in normal user setup. The locked messenger is unchanged.

## First complete installer slice

Ship a native Android Manager with an embedded original sample app. Verify its size, SHA-256, package, version, SDK requirements and signer before staging or installing. Use PackageInstaller for real user-confirmed installation. Track status across Settings/installer/app restarts, support cancellation/retry, and open only a verified installed sample. Refuse existing different-signer packages without uninstalling them.

Current Android code proves only the controlled native bootstrap. Actual Discord host attachment remains unverified. The Manager must say that plainly; installing the sample is not completion of Discord setup. Add actual supported Discord preparation only after owned host-runtime and supplied-client acceptance. No Discord APK downloads or redistribution are authorized by this Manager slice.

## Built-in updater

Check a fixed DSI GitHub release feed on an explicit user action. Report checking, current, available, downloading, verification, waiting for Android, failure and cancellation distinctly. A network failure never means up to date.

Validate feed schema, package, version/minimum SDK, download size/hash and allowed DSI release URL. APK identity and the same installed signing certificate must match before PackageInstaller receives bytes. Reject rollback versions, different signers and corrupt/incomplete data. Preserve preferences across normal same-package updates. Updates still require Android approval; no silent updates or automatic uninstall.

The production build must not accept arbitrary feed overrides. Controlled test feeds/APKs must be confined to a visibly separate QA build. Debug signing is development-only; private keys remain ignored and never ship.

## Acceptance

Build and verify APK signatures/embedded payload metadata. Run real emulator flows for unknown-app permission return, install approval/decline, cancellation/retry, installed/open and relaunch state, update verification and same-signer update installation. Inspect default, installer, success/error and large-font screenshots before publication. No physical phone or real Discord compatibility claim follows from these checks.
