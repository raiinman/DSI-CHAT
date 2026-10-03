# GitHub verification and publication

## Purpose
Own workflows for original extension verification and reviewed Pages publication.

## Ownership
workflows/platforms.yml builds/tests the Windows host/workbench and native Android APK/patcher on Windows, then tests the controlled patched fixture on an Ubuntu KVM emulator. It never installs a user APK or contacts an account. workflows/original.yml verifies/packages the Chromium extension. workflows/pages.yml builds, tests, screenshots and optionally publishes the preview.

## Local Contracts
- Push publication targets codex/dsi-original, never the preserved rewrite fork.
- Dispatch pages.yml with review_only=true on a review branch before advancing runtime UI changes to the publishing branch.
- Preserve the publication gate: tests, catalog consistency, build, browser QA, artifact and checksum verification.
- Keep dsi-messenger-screenshots available for review. A successful run is not a substitute for inspecting its screenshots.
- Review-only Pages runs also upload dsi-reviewed-site after extension ZIP packaging, for public-byte comparison. ZIP container timestamps may differ; compare packaged file checksums instead of assuming archive bytes are deterministic.
- Do not expose credentials in commands/logs or broaden permissions without a specific need.

## Work Guidance
Use Node 24 and current pinned Playwright 1.58.2 tooling as configured. Inspect review artifacts, correct defects, advance the implementation branch, then verify deployment and public bytes. Documentation-only commits may skip CI when runtime/published files are unchanged.

## Verification
Install locked devDependencies before builds. original.yml also runs real isolated extension/storage fixture QA and uploads dsi-plugin-screenshots. Existing original.yml checks unit tests, generated catalog, bundle syntax and SHA256SUMS. pages.yml adds Chromium interaction/screenshots and gated Pages publication. Record actual run status and limitations in docs/STATE.md.

## Child DOX Index
None. The workflows folder remains owned here.
