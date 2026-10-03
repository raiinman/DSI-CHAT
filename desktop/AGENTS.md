# Windows desktop host

## Purpose
Own DSI's original Electron desktop host and portable Windows packaging.

## Ownership
- package.json/package-lock.json pin Electron; main.mjs and preload.cjs own validated local IPC.
- discord-host.mjs owns official-origin media approvals, external HTTPS confirmation and bounded host-state metadata. host-qa scripts run controlled Electron origin/fake-device acceptance, never live-account calls.
- capture-guard.mjs exports CAPTURE_GUARD_SOURCE, CAPTURE_GUARD_MARKER, CAPTURE_GUARD_VERIFY_EXPRESSION and CAPTURE_GUARD_SOURCE_URL for an early public getUserMedia compatibility guard. Verification uses captured descriptor intrinsics and locked method identities; registration acknowledgement and attached debugger remain separate requirements. capture-guard-qa scripts exercise only original controlled sources; discord-host.mjs registers/verifies it before loading official pages and gates modern capture through the local picker. The module itself grants no permissions.
- renderer files own a separate local desktop control surface, not the locked Copperlight messenger.
- The launcher uses the user-approved Copperlight cream/terracotta/sage/turquoise material palette through workbench/style.css. Keep Discord actions beside a compact discoverable plugin checklist, preserving the renderer control IDs and direct feature-box label insertion contract.
- package.mjs stages portable Windows output under release/ without copying AGENTS.md.
- redteam.mjs runs an instrumented copy of current host handlers against original local attack fixtures; it records actual Electron IPC, preview isolation and busy-start teardown evidence. Development test runners do not ship in portable output.

## Local Contracts

- security/permissions.json is the source of permission defaults; policy.mjs validates host media/origin/links, local IPC roles, preview restrictions and picker limits. Screen-picker source names/thumbnails remain in local memory, with opaque selection keys and exact picker-frame/document binding. Native selected-source names are replaced with DSI selected source before callback so stream labels do not disclose window titles.
- Remote Discord content has sandbox/context isolation enabled, Node disabled and no privileged preload. Never expose workbench filesystem IPC to it.
- Enable only reviewed original built-ins through the shared PluginRuntime; unsupported private/native host access remains explicit.
- Render number settings from shared manifests, normalize through shared settings code and serialize updates; retain values through toggles, safe mode and persisted restart.
- Numeric setting changes enable their plugin; Safe mode still pauses effects. Serialize attachment per window. Install reviewed CSS through webContents.insertCSS with author origin and removeInsertedCSS on replacement/safe mode, without weakening page CSP. Report actual runtime startup results and missing context targets rather than asserting visual effects from DOM style nodes.
- The explicit local browser handoff opens the fixed official Discord app URL in the default browser; it copies no login/session data and never starts a call or capture. Remote frames cannot invoke this local IPC.
- Local fixture testing does not imply installed Discord or live-account acceptance. Opening Discord requires a deliberate user action.
- Discord camera/microphone requests require native approval, exact main-window/official-origin checks and document-generation revalidation. Reload clears grants; previews keep their separate denied session. Other permissions remain denied.
- Normalize only the official-host window's user agent by removing Electron/known DSI product tokens while retaining its actual Chromium version and OS. Do not change global/session identity, create fake native Discord bridges, or bypass the media/capture gates. Browser identity normalization is a compatibility hypothesis until live camera retesting succeeds.
- Without the verified early guard and picker, block both capture APIs on Electron44. Guarded mode permits modern getDisplayMedia through an explicit source picker; legacy constraint capture remains rejected. Never describe the JavaScript guard as a native security boundary or claim live Discord delivery from fixture frames.
- Electron45alpha14 does not resolve chosen-source enforcement: both modern and legacy requests share indistinguishable display-capture permission details, and the legacy owned-window probe succeeds after modern chooser cancellation. Do not upgrade or grant that permission on the strength of the renamed permission alone.
- Any guarded modern-picker candidate must bootstrap a script-free about:blank renderer, attach CDP, register the main-world guard in every new document before loading official content, and fail closed if registration/verification fails. CDP detach, guard exceptions, lost document identity after navigation must cancel pending requests and destroy the remote host to end active capture. Never enable capture from an inspectable page marker alone or bypass page CSP. Native origin/main-frame/generation/picker checks remain mandatory; this JavaScript guard is defense in depth, not a native security boundary.
- The guard locks prototype/instance public media methods and callback aliases, rejects legacy mandatory/optional syntax, and snapshots ordinary camera/microphone constraints into frozen null-prototype dictionaries/arrays using captured intrinsics. Camera callers using legacy constraints must migrate to standard constraints; never relax the legacy gate for compatibility.
- Remote popups never create privileged windows. HTTPS links without URL credentials require explicit native confirmation before opening the default browser; navigation/redirects retain the official origin. Host state excludes account/message content and never infers successful login.
- No automatic updater, credential extraction, remote plugin download or native Discord modification.

## Work Guidance
Preserve Electron and Chromium notices in portable artifacts. Record exact dependencies and actual offline smoke results; never claim signed installer status for a portable executable.

## Verification
Run node --test workbench/*.test.mjs and node desktop/smoke.mjs; inspect generated local-window screenshots. Run node desktop/package.mjs for Windows packaging.
Run node desktop/redteam.mjs for adversarial preview/IPC acceptance. It must reject dashboard IDE calls, rogue windows and subframe handler calls, keep outside file frames unreadable and loopback HTTP/STUN UDP/TURN TCP requests at zero under the production preview policy, and settle busy preview startup after Stop so another preview can run.
Run node desktop/host-qa.mjs for real Electron fake-device media Allow/Deny, actual subframe rejection, legacy/getDisplayMedia denial, host reload/pending-approval revocation, HTTPS confirmation and renderer isolation. Dialog responses are injected controlled test decisions; no physical devices or actual account/calls are exercised.
Host QA also checks HTTP/navigator identity consistency and reload retention, unchanged session/other-window identity, absence of a native Discord bridge, and decoded fake-camera frames over an owned local WebRTC pair.
Run node desktop/capture-guard-qa.mjs for the standalone guard candidate: early/reload installation, prototype/alias/fresh-frame legacy rejection, getter/proxy/prototype pollution, modern cancellation/owned decoded frames and detach revocation. Its injected permission/picker responses prove only the guard component. Run node --test desktop/*.test.mjs and node desktop/screen-picker-qa.mjs for production picker/host lifecycle integration. The owned source window must be visible; the runner exposes no real-account content or other window titles.
The integrated picker runner exercises real controls, cancellation, filters/audio reset, refreshed source keys, untrusted/subframe IPC, empty sources, owned chosen decoded frames, reload cancellation and host destruction after active debugger detach or a named guard exception. Native source inventory uses zero-size thumbnails; only original owned windows supply captured thumbnails. A synthetic screen row exercises UI/audio state only and must never be selected for native capture. Controlled picker acceptance does not establish live Discord delivery or system-audio transport.

## Child DOX Index
None. This guide also owns the desktop test/packaging scripts.
