# Original plugin engine

## Purpose
Own DSI-authored plugin contracts, lifecycle, settings and browser integration. Keep the locked messenger presentation unchanged.

## Ownership
runtime.mjs: manifest validation, dependency/conflict planning, owned resources and serialized lifecycle.
api.d.ts: original API 1 TypeScript authoring declarations; keep aligned with runtime validation and context.
settings.mjs: versioned plugin records and migration from the original three-feature settings.
builtins.mjs: original browser/Windows display and DOM plugins.
popup-entry.mjs: searchable twelve-plugin settings controls, validated text-size input and explicit active-tab runtime inspection. Inspection requests only DSI metadata from the existing isolated content script; no added tabs/host permission, message contents or network requests.
browser-adapter.mjs and browser-entry.mjs: isolated Chromium storage/page lifecycle integration.
index.mjs: shared bundle exports for controlled hosts and Windows.
compatibility.mjs: fixed-key DOM existence probes on exact official HTTPS channel routes; no account/message text, identifiers or private URLs. Presence reports always leave plugin effects and live parity unverified.

## Local Contracts
- API version 1; plugins are reviewed local DSI code. Capability declarations do not sandbox arbitrary JavaScript.
- Features start disabled. Unsupported platform/capability/dependency/conflict states are explicit; safe mode preserves settings.
- Own resources and clean them in reverse order. Serialize reconciliations, cancel stale asynchronous starts and bound asynchronous cleanup (default 5s per cleanup). This cannot interrupt synchronous JavaScript; controlled hosts must also bound preview destruction.
- No remote code evaluation, upstream implementation imports or private Discord runtime hooks in the browser adapter.
- Preserve the legacy three-feature API used by the locked preview; browser plugin settings use a separate v2 key.
- Built-ins accept semantic main elements as well as explicit ARIA main regions, and media in message rows. Windows may supply a host-owned style installer; the host must remove its inserted CSS on replacement/safe mode. Keep the default browser scoped style lifecycle intact.

## Work Guidance
Validate a plugin before registration. Keep diagnostics structured and bounded; do not log user/message content. Built-ins operate visible DOM/style behavior only and must restore owned mutations on stop.

## Verification
Root npm test covers registry, lifecycle, races, resources, settings and adapter behavior. npm run build bundles isolated browser entries and the shared module; browser plugin QA uses controlled local fixtures, not a live account.

## Child DOX Index
None.
