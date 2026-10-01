# DSI CHAT

Dead Signal Interactive's original Discord customization implementation.

This branch starts a new source tree. It contains no vendored Revenge, Vencord, Equicord or Vendetta engine or plugins. The earlier fork remains on the repository's `rewrite` branch with its existing licenses.

## First working slice

A Chromium Manifest V3 extension with an original feature lifecycle, local settings, safe mode, and three reversible display features:
- Signal theme: charcoal backgrounds and orange highlights.
- Compact messages: reduced vertical message padding.
- Reduced motion: suppress CSS animations and transitions.

Features start disabled. Safe mode disables all features while retaining saved choices. Settings update open Discord tabs through extension storage.

## Build and test

Use Node.js 24 or newer. No npm packages are required.

```sh
npm test
npm run catalog
npm run build
```

Load `dist/chromium` through your browser's extension developer mode, then open Discord web and the DSI CHAT toolbar popup. Development has not installed this extension into Michael's browser.

## Scope

This is the first original browser prototype, not a replacement for hundreds of upstream plugins. Android, a desktop client adapter, account switching, plugin distribution and an installer remain future work.

See [architecture](docs/ARCHITECTURE.md), [provenance](docs/PROVENANCE.md) and [validation](docs/STATE.md).

No third-party engine license is included because this tree does not import those engines. No open-source license grant has been chosen for the new DSI source; see [NOTICE](NOTICE.md). Independence of this source tree does not constitute a legal opinion about copyright, patents, trademarks or platform terms.
