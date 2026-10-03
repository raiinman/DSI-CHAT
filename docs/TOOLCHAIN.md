# DSI development tools

Prepared October 3, 2026 for the original multi-platform mod plan in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Development tools do not ship in the existing site or extension, and no upstream engine is installed as a DSI dependency.

## Ready on this Windows host

| Tool | Verified version | Purpose |
| --- | --- | --- |
| Node.js / npm | 24.19.0 / 11.17.0 | Existing builds, Node tests and package tooling |
| Git / GitHub CLI | 2.55.0 / 2.97.0 | Source control and existing review/publication workflows |
| TypeScript | 5.9.3 | Future manifest/API contract checking and optional JSDoc checks without rewriting current JavaScript |
| esbuild | 0.28.2 | Future original plugin/adapter bundling; native transform smoke test passes |
| Playwright / Chromium | 1.58.2 / 145.0.7632.6 | Local browser fixtures, interactions and rendered captures |
| Android command-line tools / Android CLI | 23.0 / 1.0.16500706 | Portable SDK inspection and future native tool setup |
| Android platform-tools / ADB | 37.0.1 / 1.0.41 | Future emulator/device work; version probe only, no device contacted |
| Existing OpenJDK | 25.0.3 | Java available; select compatible JDK/Gradle versions with the native project |

TypeScript, esbuild and Playwright are exact devDependencies in package.json/package-lock.json. Android tools are portable under ignored `.cache/toolchains/android-sdk`; their official URLs, versions, byte lengths and SHA-256 digests are pinned in [ANDROID_TOOLS.lock.json](ANDROID_TOOLS.lock.json). Initial downloads also matched the checksums published in Google's repository metadata. No system PATH or Java installation was changed.

The verified setup above was performed in the earlier DSI-CHAT-original checkout. The current OneDrive workspace is a fresh checkout; ignored node_modules/.cache tools and audit snapshots were not copied. Run the setup/probes below in each new checkout before claiming its tools are ready.

## Reproduce and verify

```sh
npm ci --ignore-scripts
npm run tools:setup
npm run tools:doctor
```

On Windows, add portable Android tools:

```sh
npm run tools:setup -- --android
npm run tools:doctor -- --android
```

Setup installs Chromium and optionally extracts the pinned official Android tools. It preserves an existing SDK directory and refuses an unexpected revision. The doctor checks pinned packages, transforms a tiny TypeScript fixture, launches Chromium against in-memory HTML and probes tool versions. It writes `.cache/toolchain-report.json`. These are tool availability checks, not full project type checking or platform integration tests.

Both scripts/browser-qa.mjs and plugin-qa.mjs now use the root-pinned Playwright dependency. CI runs npm ci --ignore-scripts before builds and installs Chromium from that package. Existing checks remain `npm test`, `npm run catalog`, `npm run build`, `node scripts/site.mjs` and `git diff --check`.

## Reference material

The ignored `.cache/upstreams/{vencord,equicord,vendetta}` checkouts are audit references only. No build imports them. Their pinned SHAs and URLs are recorded in [REFERENCE_SOURCES.json](REFERENCE_SOURCES.json). To reproduce the audit, clone each listed public repo to that location, fetch/check out its exact recorded revision, then run:

```sh
npm run references:inventory
node scripts/reference-inventory.mjs --check
```

This reads Git directory names, not source implementations. The generated inventory is a deduplicated starting point; feature acceptance specifications must be authored by DSI. Prior upstream source inspection is recorded in PROVENANCE.md; no formal clean-room claim is made.

## Platform development tools

Native Android platform35/build-tools35.0.1, emulator/image and JDK builds are prepared; android/README.md provides commands and pinned Apktool provenance. Builds use javac/aapt2/d8/zipalign/apksigner without Gradle. This Windows host cannot boot an accelerated emulator while firmware virtualization is disabled; platforms.yml supplies an Ubuntu KVM fixture gate. Desktop uses Electron44.5.1 with explicit install.js after npm ci --prefix desktop --ignore-scripts; desktop/package.mjs stages a portable executable with notices and hashes. No signed Windows installer, live account, physical device or iOS compilation is claimed.

Documentation used: [TypeScript JavaScript checking](https://www.typescriptlang.org/tsconfig/checkJs.html), [esbuild API](https://esbuild.github.io/api/), [Playwright browser installation](https://playwright.dev/docs/browsers), [Android command-line tools](https://developer.android.com/tools), [Android platform-tools](https://developer.android.com/tools/releases/platform-tools) and [Android CLI](https://developer.android.com/tools/agents/android-cli). Context7 supplied the TypeScript/Playwright/SDK documentation before tool setup; package/CLI probes establish the actual installed versions.
