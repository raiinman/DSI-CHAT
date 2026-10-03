# DSI application permissions

Edit **security/permissions.json** to inspect DSI's default permission policy. It is the single source used by the application adapters and package generators. **security/policy.mjs** validates it before use; unknown fields, decisions and unsupported permissions stop startup/build rather than falling back to permissive defaults.

| Section | Enforcement |
| --- | --- |
| discord | desktop/discord-host.mjs: exact HTTPS origin, main frame, microphone/camera choices, per-request native approval, external HTTPS confirmation and guarded capture mode |
| local | desktop/main.mjs: denied local-window native permissions, registered dashboard/workbench IPC channel allowlists, exact sender/main frame, confined local pages |
| picker | desktop/screen-picker.mjs: user gesture, request deadline, source types/count, selected-title redaction, exact local picker frame, one pending request and explicit entire-screen system audio |
| preview | desktop/main.mjs: denied permissions/downloads, allowed data/blob requests, rejected external WebRTC transport and bounded Stop |
| browser | scripts/build.mjs: generated manifest permissions/matches; src/plugins/browser-entry.mjs: runtime capability gates |
| android | security/android-build.mjs: generated native permission declarations, receiver export state and compiled Manager feed/asset/redirect policy |
| qa | Android generator: separate localhost-only updater configuration for explicitly selected controlled QA builds |

Supported tightening includes removing device types, IPC channels, browser capabilities or Android permissions; restricting external link hosts; narrowing source types/count/deadline or denying system audio; and setting discord.screenSharing to **deny**. Empty externalLinkHosts retains HTTPS destinations with native confirmation. Unknown permissions are denied. Runtime/OS approval, exact trusted origin/frame, no credential URLs, nonexported installer receivers, same-signer/version/integrity checks and legacy capture rejection remain required; adding a new supported rule needs validation, an enforcement path and acceptance checks.

Policy edits affect the next source launch or build. Browser and Android permission changes require rebuilt/reinstalled packages, and installed Windows builds have their own packaged copy. This file cannot grant OS permissions, remotely update installed clients or sandbox arbitrary plugin/test code. Project filesystem confinement and release cryptographic verification are implementation safeguards, not optional grants. GitHub workflow permissions and development-tool permissions belong to their respective external systems.

Guarded screen sharing requires the public-media guard to be registered before official page scripts, verified in the current document and attached to the host debugger. Modern requests then use the local Copperlight source picker; Cancel grants no source. The legacy capture API is blocked by a JavaScript compatibility guard, which is defense in depth rather than a native Chromium security boundary. Guard installation failure, guard exception or debugger detach closes the remote window to end active capture. Navigation invalidates pending approvals. Private picker source names/thumbnails are neither persisted nor sent to Discord. The selected native stream receives the generic label DSI selected source. Standard native stream settings still disclose the chosen capture identifier; unselected source IDs/inventory are not supplied to Discord. Blocked external navigation attempts keep the trusted document/call; losing that document identity closes the host. Real camera/Discord call delivery needs separate live acceptance.
