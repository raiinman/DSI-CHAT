# Build and browser verification tooling

## Purpose
Own reproducible catalog generation, Chromium packaging, Pages preparation and browser QA.

## Ownership
catalog.mjs, build.mjs, site.mjs and browser-qa.mjs. Generated outputs belong in ignored dist/ and .cache/.

## Local Contracts
- Node.js 24 or newer; shipped runtime remains dependency-free.
- build.mjs bundles original modules, syntax-checks both outputs and writes SHA256SUMS for packaged files.
- catalog.mjs derives catalog/features.json from src/core.mjs; do not hand-maintain a second feature list.
- site.mjs prepares dist/site; AGENTS.md instructions are development documents and must not be copied into the published site.
- Browser QA uses Playwright 1.58.2 in .cache/browser-qa, tests the local static build and writes .cache/screenshots; no live account access is implied.

## Work Guidance
Keep assertions tied to user-visible contracts, preserve coverage for themes/motion/focus/drafts/safe text/layout/export, Copperlight default theme, navigation/sidebar actions and actual-opener focus return, and add meaningful checks for new behavior. Screenshot inspection follows docs/VISUAL_WORKFLOW.md.

## Verification
Run npm test, npm run catalog, npm run build, node scripts/site.mjs and git diff --check. For browser changes run node scripts/browser-qa.mjs; confirm catalog generation leaves no unexpected diff and workflow packaging verifies checksums.

## Child DOX Index
None.
