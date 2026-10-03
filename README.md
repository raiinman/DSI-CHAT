# DSI CHAT

Dead Signal Interactive's original Discord customization implementation.

Try the [live preview](https://raiinman.github.io/DSI-CHAT/) or download the extension ZIP directly from that page. The Copperlight Realism preview has cream, terracotta, sage and turquoise surfaces, an original miniature valley banner and working local messenger controls. It changes sample messages only.

This branch starts a new source tree. It contains no vendored Revenge, Vencord, Equicord or Vendetta engine or plugins. The earlier fork remains on the repository's `rewrite` branch with its existing licenses.

## Original DSI roadmap

The goal is one original Discord mod bringing together capabilities and ideas from Vencord, Equicord and Vendetta, with DSI-authored plugins and browser/desktop/native-mobile adapters. Their engines are not merged into this implementation. The Copperlight UI/UX is locked; the next engineering target is the original plugin foundation. See the [implementation plan](docs/IMPLEMENTATION_PLAN.md), [reference inventory](docs/REFERENCE_INVENTORY.json) and [prepared tools](docs/TOOLCHAIN.md). Full plugin parity and native adapters are future milestones.

## First working slice

A Chromium Manifest V3 extension with an original feature lifecycle, local settings, safe mode, and three reversible display features:
- Signal theme: charcoal backgrounds and orange highlights.
- Compact messages: reduced vertical message padding.
- Reduced motion: suppress CSS animations and transitions.

Features start disabled. Safe mode disables all features while retaining saved choices. Settings update open Discord tabs through extension storage.

## Build and test

Use Node.js 24 or newer. The current runtime/build needs no npm packages. Pinned development tools for future engine work can be prepared with `npm ci --ignore-scripts`, `npm run tools:setup` and `npm run tools:doctor`; see the toolchain document.

```sh
npm test
npm run catalog
npm run build
```

Load `dist/chromium` through your browser's extension developer mode, then open Discord web and the DSI CHAT toolbar popup. Development has not installed this extension into Michael's browser.

## Scope

This is the first original browser prototype, not a replacement for hundreds of upstream plugins. Android, a desktop client adapter, account switching, plugin distribution and an installer remain future work.

See [architecture](docs/ARCHITECTURE.md), [provenance](docs/PROVENANCE.md) and [validation](docs/STATE.md).

Project guidance uses the [DOX hierarchy](AGENTS.md), with indexed local AGENTS.md files. Read the root and every applicable child before edits; update owning instructions when contracts change. DOX is documentation-only, attributed to Agent Zero under its [MIT license](docs/DOX_LICENSE.txt).

No third-party engine license is included because this tree does not import those engines. No open-source license grant has been chosen for the new DSI source; see [NOTICE](NOTICE.md). Independence of this source tree does not constitute a legal opinion about copyright, patents, trademarks or platform terms.
