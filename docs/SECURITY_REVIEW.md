# Controlled red-team review

Requested October 3, 2026 after the Browser/Windows/Android development and phone-only Manager slices. This is an adversarial engineering pass against our own local fixtures and API35 emulator, not an independent security certification or live Discord acceptance. No third-party service, account or physical phone was attacked.

## Findings and changes

| Finding | Controlled reproduction | Correction |
| --- | --- | --- |
| Workspace hard-link escape | A selected-project file linked to an outside sentinel could be read and saved, mutating the outside file. | Reject multiply-linked workspace/compiler input and build output files. |
| Windows alternate stream | A colon path opened/saved a hidden NTFS alternate stream. | Reject Windows colon/drive-relative paths. |
| Preview file/network escape | A file iframe read an outside HTML sentinel; its child image reached a loopback server despite parent CSP. | Use an opaque in-memory document, restrictive CSP and separate session denying file/network requests, permissions and downloads. |
| Preview WebRTC escape | STUN sent four UDP packets to a controlled loopback receiver despite CSP/request filtering. | Preview-only WebRTC IP policy and a deny proxy; regression probes UDP and TURN/TCP. |
| Hung preview blocks editor | Synchronous infinite startup was forcibly stopped, but its pending IPC action left the editor busy. | Race startup against the captured renderer destruction; settle the action so save/new preview work after Stop. |
| Test cancellation/recovery | A Linux infinite-loop Node test did not exit on SIGTERM; a gracefully cancelled test could exit zero and be labelled successful. | Captured-child SIGKILL escalation after 500 ms on POSIX for cancellation/timeout, cleared on exit; cancelled runs report failure and subsequent tests must run. |
| False Android update success | A successful current-version check followed by HTTP503 and restart became “up to date” from cached feed data. | Infer update completion only from an owned install/success journal, preserving failed/cancelled/interrupted checks. |

These require locally selected development projects/code or an update failure. They do not establish a remote privilege escalation. Fix acceptance and publication evidence are recorded in STATE.md; a test added here is not proof until the corresponding execution passes.

## Regression scope

- Shared engine: hostile JSON/prototype keys, malformed CSS setting values, inherited activation, unsafe/confusable identifiers, oversized manifests, safe-mode floods and late asynchronous resources, mutation of public reports.
- Actual isolated Chromium extension: storage/CSS injection, unsafe links, forged page messages, host/path lookalikes and filter markup. All HTTP(S) traffic is intercepted; unexpected requests fail the test.
- Workbench: traversal/symlinks, hard links, alternate streams, compiler imports and output escapes, external-save conflicts and cancellable tests.
- Actual Electron preview: trusted-window/main-frame IPC gates, absent Node/preload bridge, outside-file iframe, HTTP and WebRTC loopback sentinels, synchronous-hang Stop and recovered editor/preview.
- Native Manager: malformed/oversized feed, rollback, package/version/SDK/size/hash/certificate mismatch, different-signer archive, off-policy URL, HTTP failure, external result spoofing, failure/restart and cancel/retry. A valid same-signer update must still require Android approval.

## Reproduce

```sh
npm test
npm run build
node scripts/red-team-browser.mjs
node --test workbench/*.test.mjs
node desktop/redteam.mjs
```

Android uses manager.yml's SDK-built fixtures and full manager-qa.mjs --red-team invocation. Do not substitute a live device or Discord APK. Original and platform CI retain browser/Electron regression evidence; Manager CI retains native screenshots/journals.

## Executed acceptance

- [Original/browser and Linux workbench CI 37140088982](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088982), source 8d55cad: 40 engine tests passed; 20 workbench tests passed with the Windows-only stream case explicitly skipped. File-symlink and busy-test cancellation checks executed; the real extension attack fixture passed with zero unexpected requests.
- [Complete platform CI 37140088988](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088988) passed at 8d55cad, including source/packaged Windows smoke and monolithic/split Android fixture emulator flows. Of 21 workbench checks, 20 passed; file-symlink creation was explicitly skipped on the local Windows host because EPERM. Real NTFS hard links/junctions/streams executed. Actual Electron adversarial regression blocked outside sentinel access and HTTP/STUN UDP/TURN TCP, rejected untrusted IPC and recovered after synchronous startup.
- [Manager CI 37139689797](https://github.com/raiinman/DSI-CHAT/actions/runs/37139689797), source 125891f with unchanged Android runtime 3a64c8b: all 12 hostile update cases were refused before Android approval, with private staging empty and no owned install session remaining. Compiled result receivers were nonexported; correct-action forged successes with owned and invalid IDs left journals unchanged. No transport-denial log string was emitted, so the report makes no log-message claim. HTTP 503/restart and cancel/retry passed; a valid same-signer version 3 fixture update required native approval and preserved journals/settings.
- Root inspected passed Manager default, approval, cancellation, failure-after-restart, restored-update and large-font captures plus final packaged Windows diagnostics/preview and adversarial captures. Retained examples are in docs/design.

Release/source/public transport closeout is in STATE.md. Local Manager version 2 release identity differs from the rebuilt QA bytes and is checked separately.

Published [v0.3.0-dev.2](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.3.0-dev.2). Original-branch reruns passed: [browser/Linux](https://github.com/raiinman/DSI-CHAT/actions/runs/37140540037), [Windows/native platforms](https://github.com/raiinman/DSI-CHAT/actions/runs/37140540046), [Manager attacks and native updater](https://github.com/raiinman/DSI-CHAT/actions/runs/37140540108), and [Pages](https://github.com/raiinman/DSI-CHAT/actions/runs/37140540060). All five release downloads and the version-2 feed match reviewed bytes/identity; the unchanged public messenger and extension payloads were verified separately.

## Boundaries

The next Windows integration candidate exposed a separate Electron44 capture boundary: granting empty-media prepermission for getDisplayMedia also allowed legacy chromeMediaSource getUserMedia to capture an owned window without the chooser. A chosen-source happy-path capture passed, but did not establish enforcement. The final candidate denies both APIs and explicitly reports screen sharing/system audio unavailable. No live desktop or third-party source was captured.

October3 follow-up tested Electron45.0.0-alpha.14 in a separate ignored-cache installation, leaving the production44.5.1 pin unchanged. The modern getDisplayMedia request reached the deliberately cancelling source handler and failed with AbortError. A subsequent legacy getUserMedia chromeMediaSource request successfully captured only the original owned fixture window (404×280), without another source-handler invocation. Both permission records were display-capture with identical field sets, video mediaTypes and the controlled official-origin/main-frame values. Evidence is .cache/electron45-probe/result.json and its original probe.mjs. No account, third-party window image or full desktop was captured or retained. The [Electron45 permission split](https://github.com/electron/electron/blob/main/docs/breaking-changes.md) and [registered WebContents ID correction](https://github.com/electron/electron/pull/53708) do not enforce the application's chooser for legacy screen/window IDs. That unguarded configuration requires capture denial; the later guarded-picker section below records the current path. A separately opened supported browser uses its own login/session and native source picker.

desktop/host-qa.mjs exercises actual fake-device camera/microphone Allow/Deny, actual same-origin subframe and lookalike rejection, stale device/external approval revocation after reload, external HTTPS/protocol gates, real load failure/retry and renderer isolation. Native decisions and shell launch are controlled injected test responses. Final local result .cache/discord-host-qa-1791061985433/result.json passed with NotAllowedError for both screen APIs. Existing Electron preview/red-team and packaged smoke regressions passed separately. No physical-device call or live DSI-enabled account parity is implied.

Declared plugin capabilities are not a general arbitrary-code sandbox. Explicitly run Node tests execute with the developer's permissions. Filesystem checks do not provide an OS security boundary against a concurrent local attacker changing files between checks. Electron preview restrictions are defense in depth against the tested paths, not a universal OS network sandbox or a guarantee against Chromium vulnerabilities.

Manager releases use stable private local development keys; CI acceptance rebuilds the same source with separate QA signing/TLS fixtures. Exact public release bytes receive separate identity/hash checks. Production store signing, live Discord selectors/native attachment, Android versions beyond the tested API35, physical phones and independent penetration testing remain unverified. A process interruption between session creation and commit can still require Cancel then retry.

## Central policy and guarded picker, October 3

security/permissions.json is the single source for application permission defaults, with fail-closed schema validation and generated extension/Android scopes. Fixed security invariants remain enforced in code. Windows now denies permissions explicitly in the local launcher/IDE session; adversarial acceptance confirms real camera and display requests are rejected. Host/preview/IPC checks retain their prior origin/frame/filesystem/transport boundaries.

The original public-media guard closes the reproduced Electron44 legacy chooser bypass under the controlled regressions: prototype/alias calls, borrowed fresh realms, getters/proxies, polluted prototypes/intrinsics/iterators and legacy mandatory/optional syntax. It snapshots camera constraints into immutable null-prototype data before native conversion. The native modern handler grants only a selected source through the local Copperlight picker, with per-request identity and cancellation. Guard registration/verification precedes official page scripts; failure/detach destroys the remote host to stop active tracks. This is a JavaScript compatibility guard and defense in depth, not a native security boundary or proof against every Chromium defect.

Commands: npm test; node --test desktop/*.test.mjs workbench/*.test.mjs; node scripts/red-team-browser.mjs; node desktop/redteam.mjs; node desktop/host-qa.mjs; node desktop/capture-guard-qa.mjs; node desktop/screen-picker-qa.mjs. Actual current evidence is recorded in STATE.md. Picker fixtures contain only original owned images; a synthetic screen row proves UI/audio gating only. Real entire-screen/system-audio capture, Discord end-to-end sharing with Jade and physical-device acceptance remain unperformed.

Final integrated acceptance1791070783365 also verifies selected-title redaction to DSI selected source, decoded chosen-window pixel color, per-request repeated camera approvals, preserved call/subsequent sharing after prevented external navigation and destruction on actual origin loss. Native selected-stream settings still expose that chosen capture identifier; no unselected inventory/IDs or source thumbnails are supplied to remote pages.

Final runtime7e90b8d passed the complete controlled gates: browser/Linux37162839792, Windows/native37162839785, Manager installer/updater red-team37162839802 and Pages review37162841407. The release preserves these runtime bytes; public release and installation hash records are recorded in STATE.md.

Startup repair67adea1 retains immutable native-prototype guards and locked accessor identities, while allowing ordinary instance adapter wrapping. Capture acceptance repeats after wrappers are installed, including adapter-injected legacy constraints, borrowed fresh realms, polluted intrinsics, camera and explicit modern picker selection/cancellation. Public empty-profile login then renders without the reproduced read-only-property bootstrap exception. This changes no permission defaults and remains JavaScript defense in depth. Windows37164720621 passes; exact release/install verification is in STATE.md.
