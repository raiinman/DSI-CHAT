# DSI Manager release feed

## Purpose
Publish fixed HTTPS metadata consumed by the original Android Manager.

## Ownership
- manager.json: reviewed normal Manager APK release, version, minimum SDK, exact byte size/hash and signing certificate fingerprint.

## Local Contracts
- Use only the raiinman/DSI-CHAT GitHub release APK URL. No third-party APK providers or QA localhost endpoint.
- Preserve the private release signing key across releases. The certificate fingerprint is public; the key is never committed or distributed.
- Advance versionCode for upgrades. Populate metadata from the exact locally signed production APK/build report, then verify uploaded release bytes.
- Do not point the public feed at QA builds or unavailable releases. Keep package interactive.deadsignal.dsi.manager.

## Work Guidance
Publish reviewed source and release artifacts before advertising a newer version. Update the owning Android guide and project validation record.

## Verification
Compare feed with manager-build-report.json, apksigner output, local SHA-256 and uploaded GitHub asset digest/size. Emulator QA exercises invalid and valid update fixtures.

## Child DOX Index
No child boundaries.
