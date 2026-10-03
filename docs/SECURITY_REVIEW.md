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
| Test cancellation/recovery | A Linux infinite-loop Node test did not exit on SIGTERM; a gracefully cancelled test could exit zero and be labelled successful. | Captured-child SIGKILL escalation after500ms on POSIX for cancellation/timeout, cleared on exit; cancelled runs report failure and subsequent tests must run. |
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

- [Original/browser and Linux workbench CI37140088982](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088982), source8d55cad:40 engine tests passed;20 workbench tests passed with the Windows-only stream case explicitly skipped. File-symlink and busy-test cancellation checks executed; the real extension attack fixture passed with zero unexpected requests.
- [Complete platform CI37140088988](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088988) passed at8d55cad, including source/packaged Windows smoke and monolithic/split Android fixture emulator flows.21 workbench checks:20 passed; file-symlink creation explicitly skipped on the local Windows host because EPERM. Real NTFS hard links/junctions/streams executed. Actual Electron adversarial regression blocked outside sentinel access and HTTP/STUN UDP/TURN TCP, rejected untrusted IPC and recovered after synchronous startup.
- [Manager CI37139689797](https://github.com/raiinman/DSI-CHAT/actions/runs/37139689797), source125891f with unchanged Android runtime3a64c8b: all12 hostile update cases refused before Android approval, private staging empty and no owned install session remaining. Compiled result receivers were nonexported; correct-action forged successes with owned and invalid IDs left journals unchanged. No transport-denial log string was emitted, so the report makes no log-message claim. HTTP503/restart and cancel/retry passed; a valid same-signer version3 fixture update required native approval and preserved journals/settings.
- Root inspected passed Manager default, approval, cancellation, failure-after-restart, restored-update and large-font captures plus final packaged Windows diagnostics/preview and adversarial captures. Retained examples are in docs/design.

Release/source/public transport closeout is in STATE.md. Local Manager version2 release identity differs from the rebuilt QA bytes and is checked separately.

## Boundaries

Declared plugin capabilities are not a general arbitrary-code sandbox. Explicitly run Node tests execute with the developer's permissions. Filesystem checks do not provide an OS security boundary against a concurrent local attacker changing files between checks. Electron preview restrictions are defense in depth against the tested paths, not a universal OS network sandbox or a guarantee against Chromium vulnerabilities.

Manager releases use stable private local development keys; CI acceptance rebuilds the same source with separate QA signing/TLS fixtures. Exact public release bytes receive separate identity/hash checks. Production store signing, live Discord selectors/native attachment, Android versions beyond the tested API35, physical phones and independent penetration testing remain unverified. A process interruption between session creation and commit can still require Cancel then retry.
