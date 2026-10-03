# Windows desktop host

## Purpose
Own DSI's original Electron desktop host and portable Windows packaging.

## Ownership
- package.json/package-lock.json pin Electron; main.mjs and preload.cjs own validated local IPC.
- discord-host.mjs owns official-origin media approvals, external HTTPS confirmation and bounded host-state metadata. host-qa scripts run controlled Electron origin/fake-device acceptance, never live-account calls.
- renderer files own a separate local desktop control surface, not the locked Copperlight messenger.
- package.mjs stages portable Windows output under release/ without copying AGENTS.md.
- redteam.mjs runs an instrumented copy of current host handlers against original local attack fixtures; it records actual Electron IPC, preview isolation and busy-start teardown evidence. Development test runners do not ship in portable output.

## Local Contracts
- Remote Discord content has sandbox/context isolation enabled, Node disabled and no privileged preload. Never expose workbench filesystem IPC to it.
- Enable only reviewed original built-ins through the shared PluginRuntime; unsupported private/native host access remains explicit.
- Render number settings from shared manifests, normalize through shared settings code and serialize updates; retain values through toggles, safe mode and persisted restart.
- Local fixture testing does not imply installed Discord or live-account acceptance. Opening Discord requires a deliberate user action.
- Discord camera/microphone requests require native approval, exact main-window/official-origin checks and document-generation revalidation. Reload clears grants; previews keep their separate denied session. Other permissions remain denied.
- Normalize only the official-host window's user agent by removing Electron/known DSI product tokens while retaining its actual Chromium version and OS. Do not change global/session identity, create fake native Discord bridges, or bypass the media/capture gates. Browser identity normalization is a compatibility hypothesis until live camera retesting succeeds.
- Block both screen-capture APIs on Electron44: granting empty-media requests also permits legacy direct capture without a source chooser. Report screen sharing/system audio unsupported; do not weaken this gate to claim parity.
- Remote popups never create privileged windows. HTTPS links without URL credentials require explicit native confirmation before opening the default browser; navigation/redirects retain the official origin. Host state excludes account/message content and never infers successful login.
- No automatic updater, credential extraction, remote plugin download or native Discord modification.

## Work Guidance
Preserve Electron and Chromium notices in portable artifacts. Record exact dependencies and actual offline smoke results; never claim signed installer status for a portable executable.

## Verification
Run node --test workbench/*.test.mjs and node desktop/smoke.mjs; inspect generated local-window screenshots. Run node desktop/package.mjs for Windows packaging.
Run node desktop/redteam.mjs for adversarial preview/IPC acceptance. It must reject dashboard IDE calls, rogue windows and subframe handler calls, keep outside file frames unreadable and loopback HTTP/STUN UDP/TURN TCP requests at zero under the production preview policy, and settle busy preview startup after Stop so another preview can run.
Run node desktop/host-qa.mjs for real Electron fake-device media Allow/Deny, actual subframe rejection, legacy/getDisplayMedia denial, host reload/pending-approval revocation, HTTPS confirmation and renderer isolation. Dialog responses are injected controlled test decisions; no physical devices or actual account/calls are exercised.
Host QA also checks HTTP/navigator identity consistency and reload retention, unchanged session/other-window identity, absence of a native Discord bridge, and decoded fake-camera frames over an owned local WebRTC pair.

## Child DOX Index
None. This guide also owns the desktop test/packaging scripts.
