# DSI CHAT

Dead Signal Interactive's original Discord customization toolkit. Continue on `codex/dsi-original`; the preserved earlier fork stays on `rewrite`.

The approved [Copperlight preview](https://raiinman.github.io/DSI-CHAT/) remains locked. This release builds the original mod engine and developer tools behind that direction. Vencord, Equicord, Vendetta and Revenge provide capability references; their engines/plugins are not merged or vendored.

## Delivered development tools

| Target | Working deliverable | Validation boundary |
| --- | --- | --- |
| Browser | Manifest V3 extension, twelve original plugins, search, saved settings and safe mode | Real isolated extension/storage against intercepted local fixture markup; live Discord selector acceptance pending |
| Windows | Portable Electron host, offline plugin fixture, deliberately opened Discord web host | Packaged controls tested; user confirmed live messaging/voice audio in v0.4.0-dev.1; camera blocked by browser-support check, screen capture blocked; unsigned, no installed-Discord injection |
| Developer IDE | Original plugin editor, conflict-safe saves, diagnostics, builds/maps, cancellable tests, isolated preview/stop and checksummed export | Controlled local projects; plain text editor, no debugger/Git UI |
| Android | Native Java lab APK, three native handlers, non-root bootstrap, installed-APK exporter and monolithic/configuration-split patchers | Original fixture build/sign/patch tests; actual Discord attachment pending |
| Android Manager | One normal APK, guided original sample setup, recovery/retry/open and built-in verified updater | Native Android install approval; development signing; actual Discord setup remains unavailable |

[Current Manager and Windows downloads](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.3.0-dev.2) include the controlled red-team corrections. Unzip the entire Windows portable directory and run DSI-CHAT.exe. [Earlier browser/native development artifacts](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.2.0-dev.1) remain available. Browser developer mode loads dist/chromium. Android instructions and signing/unsupported APK boundaries are in [android/README.md](android/README.md); no Discord APK is distributed or automatically installed.

Plugins start disabled. Safe mode retains choices and removes owned effects. The browser/Windows batch includes Signal theme, compact messages, reduced motion, keyboard focus, readable code, larger text, clear links, media fitting, hidden typing indicator, wider scrollbars, full timestamp tooltips and link destinations. Native Android has separate reviewed native-view handlers; it cannot execute browser CSS plugins.

## Build and verify

Node 24+, pinned development packages and an installed Chromium:

```sh
npm ci --ignore-scripts
npm run tools:setup
npm test
npm run catalog
npm run build
npm run qa:plugins
node scripts/site.mjs
npm run qa:messenger
npm run test:workbench
```

For Windows, install the pinned Electron runtime with `npm ci --prefix desktop --ignore-scripts`, then `node desktop/node_modules/electron/install.js`. See [desktop/README.md](desktop/README.md), [workbench guide](docs/IDE_WORKBENCH.md) and [toolchain](docs/TOOLCHAIN.md). Native Android uses its documented JDK/SDK scripts.

The [Manager guide](android/manager/README.md) covers phone-only setup and the opt-in updater. Customers need no PC, ADB or file picker. The included payload is the original DSI native sample; it does not install or modify Discord.

[Download DSI Manager preview](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.3.0-dev.2): install the Manager APK, open it and choose **Start guided setup**. Approve the Android screens. Updates are checked from inside the Manager.

This is a development toolkit, not complete parity with hundreds of reference plugins. Native Discord services, actual Android client attachment, production signing and upstream package compatibility remain unfinished. Discord provides messaging; the separate Copperlight page uses fictional in-memory conversations.

The next phase preserves Discord's native functionality and tests real attachment, following the [live integration plan and acceptance ledger](docs/LIVE_INTEGRATION_PLAN.md). Runtime Inspect now reports DOM presence without private text/identifiers; matching targets do not prove effects or parity. The [new Windows development download](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.4.0-dev.1) adds native microphone/camera approval, confirmed external HTTPS links and reload/recovery. Screen sharing is explicitly blocked until chosen-source approval can be enforced safely. Android Manager remains at the unchanged v0.3.0-dev.2 release above.

See [architecture](docs/ARCHITECTURE.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [validation](docs/STATE.md), [controlled security review](docs/SECURITY_REVIEW.md) and [provenance](docs/PROVENANCE.md). [DOX](AGENTS.md) governs documentation; its [MIT notice](docs/DOX_LICENSE.txt) does not relicense DSI source. No open-source license grant has been selected for original DSI source; [NOTICE.md](NOTICE.md) records ownership limits. Preserve all shipped third-party notices.
