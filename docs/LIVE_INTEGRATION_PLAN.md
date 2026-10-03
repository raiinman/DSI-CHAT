# Live Discord integration and parity

The user's next priority is a working original DSI mod with Discord's everyday functionality preserved. Root and one implementation partner own this phase. Copperlight remains locked; the fictional messenger is not a connected Discord client.

## Definition of done

Run the supported Discord client with DSI enabled and preserve the account's existing messaging, server, media, call and permission behavior. Discord supplies its services and entitlements. DSI supplies original, reversible improvements; it does not reimplement authentication, collect account tokens or import reference engines.

A fixture passing, a rendered screenshot, a selector matching or a signed-in session alone does not establish feature parity. Record client/platform version, native baseline, DSI-enabled result, safe-mode result and recovery for each acceptance case. Mark unavailable or untested cases explicitly.

## Delivery order

1. **Reliable browser/Windows attachment.** Exact official-origin gates, explicit launch, channel-page display adapter, local settings, safe mode, load/error/closed state and reload recovery. Windows device access requires native approval; preserve the isolated remote renderer.
2. **Core acceptance.** Exercise the checklist below on an authorized account. Fix a coherent blocker group before expanding plugins. Keep Discord's native controls where a DSI control has no tested service adapter.
3. **Real non-root Android attachment.** First prove original host-to-JavaScript attachment/lifecycle/recovery in an owned controlled host. Then test an explicitly supplied official Discord APK and authorized device. Existing native lab/bootstrap and Manager sample installation do not prove this step.
4. **Ordinary distribution.** Windows installer/uninstaller and verified updater; phone Manager setup/repair with the tested real adapter. Preserve stable signing identities and explicit OS installation approval.
5. **Original capabilities and contributors.** Expand against documented behavior requirements, shared capability gates and platform-specific acceptance. Select an explicit project license before advertising an open-source license grant. Keep third-party notices.

## Acceptance ledger

| Case | Browser | Windows | Android |
| --- | --- | --- | --- |
| Existing account session/login/logout/reload | Existing signed-in session observed read-only; DSI attachment not verified | User's installed v0.4.0-dev.1 session observed in supplied screenshots; logout/reload live acceptance pending | Real client pending |
| Server/channel/DM/group navigation and history | Owned server/channel navigation baseline passed without DSI; other cases pending | User screenshots show owned channel and DM call navigation; remaining cases pending | Real client pending |
| Send/edit/delete/reply/reactions | Owned test-channel native baseline passed without DSI; DSI-enabled acceptance pending | User screenshot confirms owned test-channel message delivery; edit/delete/reply/reaction and enabled-plugin comparisons pending | Real client pending |
| Attachments/embeds/downloads/search | Live acceptance pending | Live acceptance pending | Real client pending |
| Threads/forums/roles/channel permissions | Live acceptance pending | Live acceptance pending | Real client pending |
| Notifications/unreads/account settings | Live acceptance pending | Desktop notifications unavailable; other cases pending | Real client pending |
| Microphone/camera/device changes/voice/video | Live acceptance pending | User reports live voice connected with good audio; camera blocked by Discord unsupported-browser modal; device changes/video pending | Real client pending |
| Screen sharing/system audio | Live acceptance pending | Blocked: capture permission cannot safely enforce chosen-source approval in current host | Real client pending |
| Keyboard/accessibility/responsive layout | Controlled extension/preview checks; live acceptance pending | Controlled host/workbench checks; live acceptance pending | Controlled native sample only |
| Twelve plugins/settings/safe mode/reload | Real isolated extension on intercepted fixtures; live effects pending | Controlled source/packaged fixture; live effects pending | Separate three native sample handlers; browser plugins unavailable |

Update this ledger only from actual evidence. Detailed run/results belong in [STATE.md](STATE.md); controlled security findings belong in [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

## Account and inspection contract

The user authorized their existing live account, with no contact with scammers, and selected their owned raiinman server with a section for DSI. DSI Testing / #dsi-acceptance is the bounded test destination. Begin read-only elsewhere; do not send to arbitrary contacts or start calls without a selected participant. Never retain private message bodies, account/channel identifiers, credentials or full private screenshots in public evidence. CI continues to use owned, intercepted fixtures.

Browser runtime Inspect now includes a fixed-key DOM presence report. It reads only element existence on exact HTTPS Discord channel routes, omits identifiers/text/URLs and labels every plugin effect and live parity unverified. Missing targets can be normal context (no code/media/typing). Presence helps diagnose selectors; it is not a successful interaction test.

## Current blocker and follow-up

The user rejected the green launcher/IDE presentation and explicitly requested Copperlight matching plus reliable camera and screen sharing with Jade. The tools now match the approved palette. Controlled strict-CSP testing reproduced failed inline-style attachment; Windows now uses removable author-origin host CSS, corrected semantic-main/media selectors and truthful runtime status. Live visual comparisons remain pending. The scoped Chromium identity camera hypothesis passes controlled fake-video/WebRTC testing, but live Discord video remains pending. Electron45alpha14 was also probed with an owned window: legacy capture still bypassed picker cancellation. The launcher therefore offers an explicit default-browser handoff for supported browser sharing; it transfers no session and starts no call. This is a fallback, not completed embedded screen sharing.

Electron 44's media prepermission can also authorize legacy direct desktop capture. Allowing it for a source chooser would permit a path around that chooser. The host denies screen capture, including the legacy route, until an enforceable API boundary is demonstrated. Do not enable a blanket grant or claim working screen sharing from a selected-source happy-path test. Camera/microphone approval, external HTTPS confirmation and host recovery remain independently deliverable.
