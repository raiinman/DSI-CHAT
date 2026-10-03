# Build and browser verification tooling

## Purpose
Own reproducible catalog generation, Chromium packaging, Pages preparation, browser QA and developer tool/reference preparation.

## Ownership
catalog.mjs generates implemented plugin descriptors; build.mjs uses pinned esbuild for isolated extension entries and calls build-plugins.mjs for the shared IIFE. plugin-qa.mjs loads a real extension in a temporary Chromium profile and intercepts all HTTPS traffic with local fixtures, writing .cache/plugin-screenshots. site.mjs/browser-qa.mjs preserve the locked messenger. setup-tools.mjs installs pinned development browsers/optional portable Android tools; tools-doctor.mjs probes tools with local smoke fixtures. reference-inventory.mjs reads pinned Git directory identifiers into docs/REFERENCE_INVENTORY.json. Generated builds/downloads/reports belong in ignored dist/ and .cache/.

## Local Contracts
- red-team-browser.mjs loads an isolated copy of the actual built extension and routes all web traffic to controlled fixtures. It probes hostile storage/CSS/links, main-world spoofing and host/path scope, writing ignored .cache/red-team/browser evidence. It must not contact live accounts or third-party attack targets.
- Node.js 24 or newer; shipped runtime remains dependency-free. Root exact devDependencies/package-lock.json provide TypeScript 5.9.3, esbuild 0.28.2 and Playwright 1.58.2 for development only.
- Portable Android downloads must match docs/ANDROID_TOOLS.lock.json. Preserve existing SDK files; do not alter system PATH, install into a live client or contact a device during setup/probes.
- Reference checkouts stay ignored and never enter runtime/build imports. Inventory identifiers are untriaged references, not implemented plugins.
- Mobile references Vendetta/Revenge contribute capability categories, not a directory count of external plugins. Keep bundle and loader references distinct; bare Git snapshots suffice for inventory verification.
- build.mjs bundles original modules, syntax-checks both outputs and writes SHA256SUMS for packaged files.
- catalog.mjs derives catalog/features.json from src/plugins/builtins.mjs; do not hand-maintain a second feature list.
- site.mjs prepares dist/site; AGENTS.md instructions are development documents and must not be copied into the published site.
- Browser QA uses root-pinned Playwright 1.58.2, tests the local static build and writes .cache/screenshots; no live account access is implied.
- plugin-qa.mjs also verifies the runtime presence report on intercepted official-origin fixture markup. Keep that evidence distinct from real-account attachment/effects.
- Plugin fixtures use semantic main without a redundant ARIA role and message media outside role=log, preventing selectors from passing only artificial markup.

## Work Guidance
Keep assertions tied to user-visible contracts, preserve coverage for themes/motion/focus/drafts/safe text/layout/export, Copperlight default theme, navigation/sidebar actions and actual-opener focus return, and add meaningful checks for new behavior. Screenshot inspection follows docs/VISUAL_WORKFLOW.md.

## Verification
For tooling changes run npm ci --ignore-scripts, npm run tools:setup, npm run tools:doctor (add --android on the prepared Windows host), and node scripts/reference-inventory.mjs --check when audit snapshots are present. Run npm test, npm run catalog, npm run build, node scripts/site.mjs and git diff --check. For browser changes run node scripts/browser-qa.mjs; confirm catalog generation leaves no unexpected diff and workflow packaging verifies checksums.

## Child DOX Index
None.
