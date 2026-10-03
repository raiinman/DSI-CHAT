# Original DSI phone Manager

## Purpose

Own the offline, phone-only guided installer for DSI's original controlled native demo. Actual Discord setup remains unavailable.

The built-in opt-in updater contacts only the fixed DSI GitHub feed and verifies a same-signer DSI release before native approval.

## Ownership

- `src/interactive/deadsignal/dsi/manager/MainActivity.java`: guided native UI, one primary setup action and cancel/open/retry states.
- `ManagerInstaller.java`, `InstallReceiver.java` in that package: verified private staging, PackageInstaller sessions/status persistence and explicit system approval.
- `ManagerUpdater.java`, `UpdateReceiver.java`, `ManagerUpdateConfig.java`: fixed release transport, download verification and separate durable update sessions.
- `AndroidManifest.xml`, `res/`, `build.ps1`: normal sideloadable Manager packaging and embedded controlled demo payload.
- `README.md`: API, setup scope and actual verification evidence.

## Local Contracts

- build.ps1 generates manifest permission declarations, receiver export state and ManagerUpdateConfig.java through security/android-build.mjs. Edit security/permissions.json for update feed/asset/redirect scope and permission defaults; do not maintain duplicate Java constants or source-manifest permission lists. OS install approval and same-signer/version/integrity enforcement remain required.

- Manager/demo packages are `interactive.deadsignal.dsi.manager` and `interactive.deadsignal.dsi.managerdemo`; neither is testOnly. Debug signing is development-only.
- Embed only original DSI demo APK bytes and pinned size/hash/package/version/minimum SDK/certificate metadata. Do not download APKs, import upstream loaders or package Discord.
- Verify payload before staging/committing. PackageInstaller must retain explicit Android user approval; no silent installation, uninstall, signature bypass or account-data transfer.
- Existing different-signer demo installations are refused, preserving installed data. Unknown-source permission remains an explicit Android settings action.
- Persist and recover owned installer sessions; cancellation abandons only the Manager's recorded session and removes only its private staged payload.
- The UI clearly distinguishes a controlled native demo from actual Discord attachment. Preserve locked messenger UI.
- Normal user setup requires one Manager APK and guided native approvals, with no PC/ADB/manual APK steps. Offline sample setup and online opt-in DSI updates are distinct.
- Failed/cancelled update checks retain their state across restart. Only an owned installation session or prior installation phase may reconcile to installed; a cached current-version feed is not evidence that a failed newer check succeeded.
- Reject rollback, unsupported URLs, corrupt bytes and mismatched package/SDK/signer before update installation. Preserve stable release signing identity; never distribute private signing keys.
- Only compile-time QA builds may use the fixed localhost HTTPS feed and domain-scoped dummy CA. Never ship QA APKs/assets as user releases; production has no runtime feed override.

## Work Guidance

Expose status through main-thread listener callbacks and durable state snapshots. Keep verification and APK writes off the UI thread. Use CHECKING/PREPARING/READY/NEEDS_PERMISSION/AWAITING_INSTALL/INSTALLED/CANCELLED/ERROR states. The parent owns MainActivity; backend/build work must not overwrite it.

## Verification

Build through `android/manager/build.ps1` with SDK35/build-tools35.0.1 and a JDK. Review APK signatures, embedded asset hashes and build-report metadata. Emulator Manager QA must preflight exact Manager/demo packages and trusted hashes before any install; actual physical-device/Discord support requires separate evidence.

## Child DOX Index

No child boundaries; this guide owns Manager sources/resources and parent android owns bootstrap/demo fixtures and shared tools.
