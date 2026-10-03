# DSI Windows host

Original DSI Electron integration with the shared engine. This is a portable development host, not a patch to the installed Discord application.

## Run

From the repository root, install the pinned root tools with `npm ci --ignore-scripts`, build the shared plugin bundle through the root build, then:

```sh
npm ci --prefix desktop --ignore-scripts
node desktop/node_modules/electron/install.js
npm start --prefix desktop
```

The offline fixture runs shared built-in display plugins without an account. The separate workbench provides original plugin editing, save-conflict detection, syntax/type/manifest diagnostics, esbuild output/source maps, cancellable tests, isolated preview, stop/reload and a checksummed `.dsiplugin` development package.

Opening official Discord web requires a deliberate button click. Its renderer has Node disabled, context isolation and sandbox enabled, no privileged preload and no additional remote windows. Exact official-origin/main-window camera and microphone requests require native approval; reload clears device grants and revokes outstanding approvals. Device/OS availability still applies. Other permissions, including desktop notifications, remain denied. Reviewed original display plugins run in a separate isolated world on channels pages. Display selectors remain subject to Discord DOM changes.

External HTTPS links without URL credentials open in the system browser only after native confirmation; other protocols and cross-origin host navigation are denied. The separate desktop dashboard reports loading, app/login page, channels page, failure and closed states, with Reload/retry. These states do not inspect account content or prove successful login. The persistent official-web partition preserves its own website session; DSI does not read credentials.

Choose **Open Discord in browser for screen sharing** to deliberately open the fixed official Discord website in your default browser. It uses a separate website session: sign in there if needed and switch the call yourself. The action does not transfer credentials or start/leave calls. Use a supported Chrome/Edge browser with its native source picker; DSI's browser extension supplies display plugins separately. This route is not screen sharing inside the Electron host.

The official-web window removes Electron/DSI application product tokens from its user agent, keeping its actual Chromium version, operating system and engine tokens. This uses [Electron's window-scoped setUserAgent API](https://www.electronjs.org/docs/latest/api/web-contents#contentssetuseragentuseragent); session defaults, dashboard and isolated previews keep their original identity. No native Discord bridge or private runtime hooks are supplied. [Discord's browser requirements](https://support.discord.com/hc/en-us/articles/213491697-What-are-the-OS-system-requirements-for-Discord) list Chrome108+; this is not certification of an Electron host. The change targets the user's reported unsupported-browser camera dialog; its cause is a hypothesis and live camera success needs a separate retest. Controlled QA verifies HTTP/navigator consistency plus approved fake-camera video decoded over an owned local WebRTC pair. Real camera, codec negotiation with Discord and actual calls are separate acceptance boundaries.

Embedded screen sharing now uses an explicit Copperlight picker in guarded mode: choose a screen/window, then Share; Cancel grants no source. Windows entire-screen audio is opt-in; window sharing never enables loopback sound. The central security/permissions.json policy controls the defaults. Electron44 still permits legacy chromeMediaSource capture around the modern handler without extra enforcement; DSI registers and verifies its original public-media compatibility guard before page scripts. Legacy capture constraints are rejected, and guard loss closes the remote window to end active capture. This guard is JavaScript defense in depth, not a native Chromium security boundary. Controlled source/frames and cancellation need their own evidence; actual Discord delivery with Jade remains a live acceptance step.

A separate ignored-cache probe on Electron45.0.0-alpha.14 (Chromium156.0.8077.0) confirms that the renamed display-capture permission is insufficient: modern chooser cancellation returned AbortError, while a legacy request captured only the owned test window at404×280 without invoking that chooser. Both requests carried the same permission-detail fields. The prerelease was not adopted. Screen sharing in a supported browser with its native picker remains a separate safe option, with its own website session and live acceptance requirements. See [Electron45 capture changes](https://github.com/electron/electron/blob/main/docs/breaking-changes.md) and [registered WebContents source restriction](https://github.com/electron/electron/pull/53708), which does not remove legacy screen/window source IDs.

## Validate and package

```sh
node --test workbench/*.test.mjs
node workbench/redteam-probes.mjs
node desktop/redteam.mjs
node desktop/host-qa.mjs
node desktop/capture-guard-qa.mjs
node --test desktop/*.test.mjs
node desktop/screen-picker-qa.mjs
node desktop/smoke.mjs
node desktop/package.mjs
node desktop/smoke.mjs --packaged
```

Smoke captures dashboard, fixture, workbench and plugin preview under `.cache/desktop-smoke-*`. Portable packaging produces `release/dsi-chat-windows-portable/DSI-CHAT.exe` plus required runtime files and checksums. Keep the whole directory together. It is unsigned and has no automatic updater or automatic installation. Electron's default application icon is retained; no upstream mod branding is used.

## Dependencies and provenance

The capture guard exports an original public-media wrapper as CAPTURE_GUARD_SOURCE, with CAPTURE_GUARD_MARKER naming its immutable version marker. It grants no permissions. Host integration must create/load a script-free about:blank renderer, attach Electron's [documented debugger transport](https://www.electronjs.org/docs/latest/api/debugger), and register [Page.addScriptToEvaluateOnNewDocument](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument) in the main world before loading official content. Use runImmediately for existing empty contexts; retain page CSP and no remote privileged preload. A marker is diagnostic metadata, not authorization. Failed installation, debugger detach, guard exceptions or lost trusted document identity require request cancellation and remote-host destruction so existing tracks end. The central permissions policy and native exact-origin/main-frame/document checks remain independent gates.

The guard snapshots camera constraints before checking/passing them to native getUserMedia, locks public prototype/instance methods and legacy callback aliases, and rejects mandatory/optional legacy constraint syntax. Detached dictionaries/arrays have null prototypes and immutable values/iterators, preventing page prototype pollution from supplying unexamined capture constraints. Only standard camera/microphone constraint syntax is retained. This is JavaScript defense in depth, not a native security boundary or universal browser security claim. The standalone runner validates original owned-window modern capture plus two decoded frames, chooser cancellation, legacy rejection from fresh realms, mutable getters/proxies, poisoned intrinsics/prototypes, reload and permission denial after detach. Standalone guard acceptance does not prove live Discord screen sharing or end-to-end call delivery; the integrated picker has its own controlled acceptance runner.

Run `node desktop/screen-picker-qa.mjs` for the actual host/picker integration with isolated profiles and original owned sources. It checks real Cancel/Share controls, filters, computer-audio reset when changing to a window, refreshed selection tokens, rogue/subframe IPC denial, empty-source recovery, legacy/subframe capture denial, reload cancellation, and host destruction on debugger detach or named guard exceptions. Native inventory requests zero-size thumbnails; only owned windows provide captured images. A synthetic entire-screen row tests UI state only; no desktop-wide capture or system-audio transport is asserted. The selected owned window produces two decoded 404×280 frames in the controlled renderer. Screenshots cover ordinary and 580×460 picker sizes. These checks do not prove live Discord screen delivery, call encryption or physical device behavior.

The local launcher and workbench follow the approved Copperlight palette: cream paper surfaces, sage navigation, terracotta accents and turquoise actions with shallow material depth. The launcher groups Discord actions beside a compact saved plugin checklist; the editor keeps its working file tabs, diagnostics and build/test/preview/export controls. Styling does not replace Discord's UI or alter the locked messenger preview. Offline rendered checks cover 1440,1000 and800px windows; narrow windows scroll without horizontal clipping.

- Electron **44.5.1**, official npm package and official installer-downloaded runtime. MIT notice in `desktop/node_modules/electron/LICENSE`; packaged runtime retains `LICENSE` and `LICENSES.chromium.html`.
- TypeScript **5.9.3** (Apache-2.0) and esbuild **0.28.2** (MIT), reused from the root pinned development dependencies. Compiler libraries and their notices ship in the portable workbench.
- Playwright **1.58.2** is root test tooling only and does not ship.
- DSI authored all host, editor, project service, template, fixture and packaging integration in these directories. No Vencord, Equicord or Vendetta code/assets/build tooling is included.

Documentation fetched through Context7: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation), [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window), [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API). Diagnostics use a confined CompilerHost; external imports and junction escapes are unavailable to type checking.

Tests execute selected workspace code as the current user after an explicit development action; they are not an arbitrary-code security sandbox. Editor/compiler/build operations reject workspace escapes, multiply-linked files and Windows named streams. These path checks are not an OS sandbox against concurrent local filesystem mutation. Plugin previews use opaque in-memory documents with trusted inline CSS, no Node/preload privilege, blocked frames/workers, and denied file/network requests in a dedicated session. Stop permits 1000ms for graceful cleanup, then forcibly destroys the captured preview host; destruction also settles hanging startup and releases the editor action guard.
Preview WebRTC disables non-proxied UDP; remaining transport uses a host-owned rejecting loopback proxy that closes with the captured window or failed initialization. The policy is confined to preview sessions. Controlled HTTP, STUN UDP and TURN TCP fixtures verify those routes remain blocked; this is not certification against all Chromium defects or an OS network sandbox.

## Recorded acceptance

October 3, 2026: eleven workbench tests passed. Both source and packaged Electron 44.5.1 hosts passed offline smoke, including actual editor save, a deliberate TypeScript error and correction, build/test buttons, preview/stop controls, package checksum and renderer isolation. Desktop, editor, diagnostics, plugin preview and Windows fixture screenshots were inspected. Safe mode and all twelve built-ins are available in the desktop controls. Numeric settings come from shared manifest descriptors; the text-size control applies 22px in the real Windows fixture, preserves that value through safe mode and survives dashboard reload and persisted storage. The portable directory preserves runtime/app/compiler files and SHA256SUMS.txt. No live Discord account, native installed-Discord injection, signed installer or physical-device test was performed.

New plugin projects include the shared dsi-api.d.ts authoring types and use DSIPlugin with an inferred typed context. Build before Run built tests: the generated behavior test executes the compiled module and checks visual resource attachment and cleanup. Missing scope methods produce file/line diagnostics before build.
