# DSI developer workbench

## Purpose
Own the separate local plugin editor, selected-workspace operations and controlled development preview.

## Ownership
- service.mjs owns filesystem restrictions, conflicts, diagnostics, build/test and development-package operations.
- index.html/app.mjs/style.css own the separate editor presentation.
- fixture files own explicitly launched sandboxed local previews, without desktop/workbench filesystem APIs.
- Tests and template source stay here; shared engine contracts remain in src/plugins/.

## Local Contracts
- Resolve every path against the explicitly selected workspace and reject symlink escapes. TypeScript compiler reads stay inside that workspace or the pinned compiler standard-library directory; disable automatic ambient type discovery. Never silently overwrite externally changed files.
- Use the shared manifest validator and PluginRuntime. A capability declaration does not sandbox arbitrary JavaScript.
- Build outputs live in .dsi-build and are separate from source. Tests execute local selected-project code only after a deliberate action, in a cancellable separate process.
- Export .dsiplugin development JSON packages with manifest, compiled source and SHA-256, not automatically installed/published plugins.
- Preview is an isolated renderer without Node/preload privileges and never connects to a live account. Stop destroys its resources/window.
- The Copperlight messenger is untouched; this is a separate developer tool.

## Work Guidance
Keep save, diagnostics, build, test, cancellation, preview and packaging actions real. Show precise failure messages and preserve dirty buffers during failed actions.

## Verification
Run node --test workbench/*.test.mjs and node desktop/smoke.mjs. Verify create/open/edit/save/conflict, path guards, deliberate error/correction, build/test/preview/stop/export, and inspect screenshots.

## Child DOX Index
None. Template assets are owned by this guide.
