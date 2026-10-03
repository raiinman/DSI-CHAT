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

Opening official Discord web requires a deliberate button click. Its renderer has Node disabled, context isolation and sandbox enabled, no privileged preload, denied permission requests and blocked additional windows. Reviewed built-in styles run in a separate isolated world only on `https://discord.com/channels/` pages. Native Discord injection, voice/video permissions, external link handling and live-account acceptance are not delivered. Display selectors remain subject to Discord DOM changes.

## Validate and package

```sh
node --test workbench/*.test.mjs
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

Tests execute selected workspace code as the current user after an explicit development action; they are not an arbitrary-code security sandbox. Plugin previews have no Node or preload privilege, block network by CSP and are distinct from account-bearing windows. Stop permits 1000ms for graceful cleanup, then forcibly destroys the captured preview host; hanging cleanup cannot keep it open.

## Recorded acceptance

October 3, 2026: eleven workbench tests passed. Both source and packaged Electron 44.5.1 hosts passed offline smoke, including actual editor save, a deliberate TypeScript error and correction, build/test buttons, preview/stop controls, package checksum and renderer isolation. Desktop, editor, diagnostics, plugin preview and Windows fixture screenshots were inspected. Safe mode and all twelve built-ins are available in the desktop controls. Numeric settings come from shared manifest descriptors; the text-size control applies 22px in the real Windows fixture, preserves that value through safe mode and survives dashboard reload and persisted storage. The portable directory preserves runtime/app/compiler files and SHA256SUMS.txt. No live Discord account, native installed-Discord injection, signed installer or physical-device test was performed.

New plugin projects include the shared dsi-api.d.ts authoring types and use DSIPlugin with an inferred typed context. Build before Run built tests: the generated behavior test executes the compiled module and checks visual resource attachment and cleanup. Missing scope methods produce file/line diagnostics before build.
