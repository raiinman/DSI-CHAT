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

## Boundaries

Declared plugin capabilities are not a general arbitrary-code sandbox. Explicitly run Node tests execute with the developer's permissions. Filesystem checks do not provide an OS security boundary against a concurrent local attacker changing files between checks. Electron preview restrictions are defense in depth against the tested paths, not a universal OS network sandbox or a guarantee against Chromium vulnerabilities.

Manager releases use stable private local development keys; CI acceptance rebuilds the same source with separate QA signing/TLS fixtures. Exact public release bytes receive separate identity/hash checks. Production store signing, live Discord selectors/native attachment, Android versions beyond the tested API35, physical phones and independent penetration testing remain unverified. A process interruption between session creation and commit can still require Cancel then retry.
