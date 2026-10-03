# DSI developer workbench

## Purpose
Own the separate local plugin editor, selected-workspace operations and controlled development preview.

## Ownership
- service.mjs owns filesystem restrictions, conflicts, diagnostics, build/test and development-package operations.
- index.html/app.mjs/style.css own the separate editor presentation.
- fixture files own explicitly launched sandboxed local previews, without desktop/workbench filesystem APIs.
- Tests and template source stay here; shared engine contracts remain in src/plugins/.
- redteam.test.mjs owns persistent traversal, junction, hardlink, Windows named-stream, import, conflict and busy-test regressions. redteam-probes.mjs records repeatable controlled filesystem/process observations.

## Local Contracts
- Resolve every path against the explicitly selected workspace and reject symlink escapes. TypeScript compiler reads stay inside that workspace or the pinned compiler standard-library directory; disable automatic ambient type discovery. Never silently overwrite externally changed files.
- Reject multiply-linked editable/build-output files; do not reject ordinary directories or pinned compiler standard libraries. On Windows reject colon paths that identify alternate data streams or drive-relative paths. These checks are containment guards, not an operating-system sandbox against local filesystem mutation.
- Use the shared manifest validator and PluginRuntime. A capability declaration does not sandbox arbitrary JavaScript.
- Build outputs live in .dsi-build and are separate from source. Tests execute local selected-project code only after a deliberate action, in a cancellable separate process.
- POSIX test cancellation and timeout escalate from SIGTERM to SIGKILL after 500ms if the captured test process remains alive; clear the deadline when it exits. Windows retains native termination.
- New templates copy the shared typed SDK as dsi-api.d.ts and type plugins with DSIPlugin. Build before running generated behavior tests; they execute the compiled module and assert resource attachment/cleanup.
- Export .dsiplugin development JSON packages with manifest, compiled source and SHA-256, not automatically installed/published plugins.
- Preview is an isolated renderer without Node/preload privileges and never connects to a live account. Stop allows at most 1000ms for graceful cleanup, then destroys the captured host window even if plugin code hangs; report forced teardown.
- Preview uses an opaque in-memory document with trusted inline CSS, blob-only script execution and denied frames/workers/connections/objects/base URLs. Its dedicated ephemeral session denies file/network requests and permissions. Captured host destruction settles preview startup and releases the editor action guard, including synchronous plugin hangs.
- Preview WebRTC disables non-proxied UDP and routes remaining transport through a host-owned rejecting loopback proxy with no direct fallback or loopback bypass. Close that proxy on preview destruction or failed initialization. This scoped transport policy does not alter dashboard or account-bearing sessions and does not constitute a general OS network sandbox.
- The Copperlight messenger is untouched; this is a separate developer tool.

## Work Guidance
Keep save, diagnostics, build, test, cancellation, preview and packaging actions real. Show precise failure messages and preserve dirty buffers during failed actions.

## Verification
Run node --test workbench/*.test.mjs and node desktop/smoke.mjs. Verify create/open/edit/save/conflict, path guards, deliberate error/correction, build/test/preview/stop/export, and inspect screenshots.
Run node workbench/redteam-probes.mjs and node desktop/redteam.mjs for controlled filesystem/process and actual Electron attack fixtures. Windows hardlink/named-stream regressions must execute on supported filesystems; explicitly report unsupported-host skips.

## Child DOX Index
None. Template assets are owned by this guide.
