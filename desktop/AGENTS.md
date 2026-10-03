# Windows desktop host

## Purpose
Own DSI's original Electron desktop host and portable Windows packaging.

## Ownership
- package.json/package-lock.json pin Electron; main.mjs and preload.cjs own validated local IPC.
- renderer files own a separate local desktop control surface, not the locked Copperlight messenger.
- package.mjs stages portable Windows output under release/ without copying AGENTS.md.

## Local Contracts
- Remote Discord content has sandbox/context isolation enabled, Node disabled and no privileged preload. Never expose workbench filesystem IPC to it.
- Enable only reviewed original built-ins through the shared PluginRuntime; unsupported private/native host access remains explicit.
- Render number settings from shared manifests, normalize through shared settings code and serialize updates; retain values through toggles, safe mode and persisted restart.
- Local fixture testing does not imply installed Discord or live-account acceptance. Opening Discord requires a deliberate user action.
- No automatic updater, credential extraction, remote plugin download or native Discord modification.

## Work Guidance
Preserve Electron and Chromium notices in portable artifacts. Record exact dependencies and actual offline smoke results; never claim signed installer status for a portable executable.

## Verification
Run node --test workbench/*.test.mjs and node desktop/smoke.mjs; inspect generated local-window screenshots. Run node desktop/package.mjs for Windows packaging.

## Child DOX Index
None. This guide also owns the desktop test/packaging scripts.
