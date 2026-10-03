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

The official-web window removes Electron/DSI application product tokens from its user agent, keeping its actual Chromium version, operating system and engine tokens. This uses [Electron's window-scoped setUserAgent API](https://www.electronjs.org/docs/latest/api/web-contents#contentssetuseragentuseragent); session defaults, dashboard and isolated previews keep their original identity. No native Discord bridge or private runtime hooks are supplied. [Discord's browser requirements](https://support.discord.com/hc/en-us/articles/213491697-What-are-the-OS-system-requirements-for-Discord) list Chrome108+; this is not certification of an Electron host. The change targets the user's reported unsupported-browser camera dialog; its cause is a hypothesis and live camera success needs a separate retest. Controlled QA verifies HTTP/navigator consistency plus approved fake-camera video decoded over an owned local WebRTC pair. Real camera, codec negotiation with Discord and actual calls are separate acceptance boundaries.

Screen sharing and system-audio capture remain blocked. On pinned Electron44, accepting the empty-media prepermission needed by getDisplayMedia also permits legacy chromeMediaSource direct capture without the host's source chooser. This bypass was reproduced against an owned QA window; both routes are now denied. Neither a dependency upgrade nor a source menu alone proves a safe boundary. Native Discord integration, private runtime plugins and full feature parity remain separate gates. Controlled fake-device acceptance does not establish real Discord calls.

## Validate and package

```sh
node --test workbench/*.test.mjs
node workbench/redteam-probes.mjs
node desktop/redteam.mjs
node desktop/host-qa.mjs
node desktop/smoke.mjs
node desktop/package.mjs
node desktop/smoke.mjs --packaged
```

Smoke captures dashboard, fixture, workbench and plugin preview under `.cache/desktop-smoke-*`. Portable packaging produces `release/dsi-chat-windows-portable/DSI-CHAT.exe` plus required runtime files and checksums. Keep the whole directory together. It is unsigned and has no automatic updater or automatic installation. Electron's default application icon is retained; no upstream mod branding is used.

## Dependencies and provenance

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
