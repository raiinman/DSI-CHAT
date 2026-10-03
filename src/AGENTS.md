# Runtime and Chromium adapters

## Purpose
Own the original feature lifecycle, settings and extension JavaScript.

## Ownership
- core.mjs: feature declarations, settings normalization and reversible runtime.
- features.mjs: original display CSS and owned style cleanup.
- content.mjs: storage reconciliation, revision races and page lifecycle.
- popup.mjs: extension settings loading, saving and failure feedback.

## Local Contracts
- Keep settings validated, features disabled by default, and safe mode reversible without losing choices.
- Feature start returns cleanup; failures must not prevent other features from running.
- Content scripts remain isolated; do not hook Discord's private JavaScript runtime.
- Preserve revision guards so stale async reads cannot override newer changes.
- No runtime npm dependencies, remote code, telemetry or upstream plugin code.

## Work Guidance
Update feature declarations, CSS, popup controls and generated catalog together when capabilities change. The Pages preview excludes the extension's Signal theme; preserve its separate full themes.

## Verification
Run npm test, npm run catalog and npm run build. Build syntax-compiles bundled content/popup scripts. Site behavior changes also require the existing browser QA and visual review workflow.

## Child DOX Index
None. All files here remain owned by this document.
