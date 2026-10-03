# Build and browser verification tooling

## Purpose
Own reproducible catalog generation, Chromium packaging, Pages preparation, browser QA and developer tool/reference preparation.

## Ownership
catalog.mjs, build.mjs, site.mjs and browser-qa.mjs retain their existing behavior. setup-tools.mjs installs pinned development browsers/optional portable Android tools; tools-doctor.mjs probes tools with local smoke fixtures. reference-inventory.mjs reads pinned Git directory identifiers into docs/REFERENCE_INVENTORY.json. Generated builds/downloads/reports belong in ignored dist/ and .cache/.

## Local Contracts
- Node.js 24 or newer; shipped runtime remains dependency-free. Root exact devDependencies/package-lock.json provide TypeScript 5.9.3, esbuild 0.28.2 and Playwright 1.58.2 for development only.
- Portable Android downloads must match docs/ANDROID_TOOLS.lock.json. Preserve existing SDK files; do not alter system PATH, install into a live client or contact a device during setup/probes.
- Reference checkouts stay ignored and never enter runtime/build imports. Inventory identifiers are untriaged references, not implemented plugins.
- build.mjs bundles original modules, syntax-checks both outputs and writes SHA256SUMS for packaged files.
- catalog.mjs derives catalog/features.json from src/core.mjs; do not hand-maintain a second feature list.
- site.mjs prepares dist/site; AGENTS.md instructions are development documents and must not be copied into the published site.
- Browser QA uses Playwright 1.58.2 in .cache/browser-qa, tests the local static build and writes .cache/screenshots; no live account access is implied.

## Work Guidance
Keep assertions tied to user-visible contracts, preserve coverage for themes/motion/focus/drafts/safe text/layout/export, Copperlight default theme, navigation/sidebar actions and actual-opener focus return, and add meaningful checks for new behavior. Screenshot inspection follows docs/VISUAL_WORKFLOW.md.

## Verification
For tooling changes run npm ci --ignore-scripts, npm run tools:setup, npm run tools:doctor (add --android on the prepared Windows host), and node scripts/reference-inventory.mjs --check when audit snapshots are present. Run npm test, npm run catalog, npm run build, node scripts/site.mjs and git diff --check. For browser changes run node scripts/browser-qa.mjs; confirm catalog generation leaves no unexpected diff and workflow packaging verifies checksums.

## Child DOX Index
None.
