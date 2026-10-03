# Original DSI CHAT implementation plan

User direction, October 3, 2026: one original Discord mod bringing together capabilities and ideas from Vencord, Equicord and Vendetta. Author DSI's engine, plugins and adapters; do not merge or vendor their implementations. Continue `codex/dsi-original` and preserve existing work. Copperlight UI/UX remains locked at reviewed runtime `147a9b0`, published source `d1fc3e8`.

## Product and architecture

One DSI plugin contract and settings model, with platform adapters for browser, desktop and native mobile. Share platform-independent behavior; let adapters implement host operations and explicitly report unsupported capabilities. Browser DOM code is not a native mobile implementation.

Before this sprint, the starting point was three reversible browser display features, a synchronous FeatureRuntime, validated settings, safe mode, sixteen tests and a reviewed local messenger preview. The original desktop/native loader milestones below were then unimplemented. Discord supplies messaging; a new standalone messaging server is outside this plan.

Grow the existing runtime rather than replace the repository. Add a versioned plugin manifest (ID, version, DSI API range, platform/capability requirements, dependencies, conflicts and settings schema), a registry, deterministic dependency ordering, scoped host services and owned cleanup. A plugin can run only when its platform and host capabilities are available. Plugin declarations and scoped services do not sandbox arbitrary JavaScript; start with reviewed built-in DSI modules, without remote evaluation or claims of upstream binary compatibility.

The platform boundary covers storage, lifecycle, event subscriptions, style/view attachment, logging and diagnostics. Native interfaces and permissions remain adapter-specific. Keep the locked preview as presentation/fixture evidence, not proof of an attached Discord client.

## Reference audit and feature backlog

Pinned snapshots are in [REFERENCE_SOURCES.json](REFERENCE_SOURCES.json), and the initial directory-name inventory is [REFERENCE_INVENTORY.json](REFERENCE_INVENTORY.json). It contains 166 Vencord reference directories, 363 Equicord reference directories and 366 unique identifiers, including 163 shared identifiers. These are source directory names, not verified feature behavior or delivered DSI plugins. Internal `_api`/`_core` directories are excluded. Vendetta contributes mobile runtime/loader requirements; its external plugin ecosystem is not included in this directory inventory. Its repository reports that the project is discontinued.

For each reference capability, write an original behavior specification: user outcome, platform, required host access, settings, failure/cleanup behavior and acceptance fixtures. Deduplicate by behavior, not only name: several identifiers may represent overlapping outcomes. Record supported, partial, planned or infeasible per platform; do not promise full parity from a file count.

Initial families, in order:

1. Engine reliability: lifecycle, safe mode, plugin dependency/conflict handling, reversible resources, settings migration and diagnostics.
2. Accessibility and display: the existing reduced motion/compact layout, readable formatting, local appearance and spoiler controls.
3. Navigation and composition: channel shortcuts, local commands, text transformations, timestamps, reply helpers and copy actions.
4. Organization and media: favorites, local grouping, attachment/link utilities, preview controls and visible-state notification improvements.
5. Platform-specific features: desktop notifications/presence and native mobile attachment, themes and host discovery, after each adapter proves support.

Evaluate features requiring private host internals separately. A name such as `showHiddenChannels` is not authorization or proof of access to server-restricted content. Unsupported capabilities remain disabled with an accurate reason.

## Delivered development sprint

The user authorized two subagents and a five-hour delivery target for Browser, Windows, ordinary non-root Android and the requested IDE. The foundation below is implemented; the table retains the original sequence, not elapsed-time evidence.

| Time | Deliverable | Acceptance |
| --- | --- | --- |
| 0:00–0:45 | Original manifest and platform capability contract; first prioritized behavior specifications | Existing settings/runtime compatibility recorded; unsupported capabilities explicit |
| 0:45–2:15 | Registry, dependency/conflict validation and lifecycle orchestration | Reject duplicate IDs, dependency cycles and unsupported API/platform requirements |
| 2:15–3:30 | Resource cleanup, plugin failure isolation and safe-mode recovery | Starting/stopping failures contained; listeners/styles/timers cleaned up; safe mode retains saved choices |
| 3:30–4:30 | Adapt the three existing DSI display features to the contract | Existing browser behavior and names retained; no Copperlight UI changes |
| 4:30–5:15 | Controlled browser fixtures and versioned settings migration | Enable/disable/reload/teardown tested; invalid data repaired; no live account required |
| 5:15–6:00 | Existing checks, build/provenance review and documented deliverable | Tests/catalog/build/checksums pass; inspect screenshots if any rendered surface changes; publish only the reviewed artifact |

Delivered: original API1 foundation, twelve browser/Windows plugins, portable Windows host and IDE, native Android lab and non-root local bootstrap/patcher. Controlled fixture validation does not establish complete parity or actual Android Discord attachment. If asynchronous start is introduced, serialize reconciliation and test stale-start cancellation and disposal rather than hiding races behind a promise.

## Following milestones

| Milestone | Concrete gate |
| --- | --- |
| Browser adapter and first original feature batch | Behavior specs and controlled fixtures pass; permissions and settings migration remain explicit |
| DSI developer IDE/workbench | Edit/save an original plugin project, validate/type-check, build, run tests, preview/reload in a controlled host and package through working controls; see [IDE_WORKBENCH.md](IDE_WORKBENCH.md) |
| Desktop adapter | Select and document original attachment method, startup/teardown and host capability access; test offline fixtures before installing into a user's Discord client |
| Native Android adapter | Define native bootstrap/host discovery and recovery; build a test host, validate on emulator/device, then prove actual Discord attachment separately |
| iOS adapter | Requires a macOS/Xcode environment and a separately validated native loader; Windows/browser tests cannot satisfy this gate |
| Plugin distribution and updates | Versioned DSI packages, integrity/provenance, explicit install/update behavior and recovery; upstream plugin packages are not automatically compatible |
| Feature expansion | Deliver and test original behavior in small batches; maintain the platform capability matrix |

Native mobile is a substantial adapter project. An Android WebView wrapper does not fulfill Vendetta-style native mobile capabilities. Keep development local until the user authorizes installation or live account interaction. No automatic client installation, login or remote plugin execution is part of tool preparation.

## Tools and continuation

See [TOOLCHAIN.md](TOOLCHAIN.md) for installed tools, reproducible commands and platform setup. The engine sprint above is delivered; remaining live-client and feature-expansion gates are listed below. The user also requested our own IDE tool: [IDE_WORKBENCH.md](IDE_WORKBENCH.md) defines a separate developer workspace that follows the plugin contract/browser fixtures and uses the same validators and build tools. [UI_ROADMAP.md](UI_ROADMAP.md) stays deferred under the messenger UI/UX lock; preserve the existing source/licensing history and DOX hierarchy.

## Current capability gates

Browser/Windows support styles, visible DOM and event cleanup. Android supports native views, local storage and diagnostics with three native handlers; discord.runtime is unavailable. IDE development packages are integrity-tagged and unreviewed, with no automatic live install. Next priority is real Android attachment acceptance with an explicitly supplied supported APK/device, followed by private-host capability discovery and prioritized original composition/navigation plugins. Preserve the locked Copperlight shell.
