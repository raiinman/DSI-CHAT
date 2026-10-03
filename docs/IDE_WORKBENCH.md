# DSI developer workbench

User direction, October 3, 2026: build an IDE tool for us alongside the original DSI CHAT mod. The first usable editor is implemented in desktop/ and workbench/. It is a separate workspace and does not reopen the locked Copperlight messenger UI/UX.

## First usable slice

An original DSI plugin workbench using the same manifest/API contract, compiler, bundler and test fixtures as the mod:

- Open an explicitly selected local project, browse its files and edit JavaScript/TypeScript, CSS and JSON in tabs. Save changes, track unsaved edits and handle external file changes without overwriting them silently.
- Create a DSI plugin from an original template, with manifest, settings schema and a small behavior test.
- Show syntax/type/manifest diagnostics with file and line links. Validate API versions, dependencies, conflicts and host capability requirements through the shared engine validator.
- Build the selected plugin through pinned tooling and show structured output, errors and source maps. Keep build outputs separate from source files.
- Run the selected plugin's tests and enable/disable it in a controlled local host fixture. Provide explicit reload and stop controls and show lifecycle errors, active capabilities and cleanup results.
- Package a validated original DSI plugin with metadata and checksums. Distinguish a development package from a reviewed release; packaging does not automatically publish, install or execute it in a user's Discord client.

Keep the first workbench focused on these complete actions. Broader code navigation, full debugger integration, Git diff/commit UI, adapter inspectors and Android device tools follow as independent slices. A logs panel alone is not a full debugger, and a test fixture is not proof of live-client support.

## Integration and boundaries

The workbench depends on the original plugin foundation and the browser fixture harness in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Its first milestone follows those foundations and can precede desktop/native-mobile adapter work. It must consume the shared contract and validators rather than invent a second plugin format or duplicate settings logic.

Reuse the pinned TypeScript/esbuild/Playwright development tools in [TOOLCHAIN.md](TOOLCHAIN.md). Choose the editor component and local host packaging during implementation, using current documentation and recording all dependencies/notices. DSI authors the workbench integration, project model, workflows and plugin API; standard editor/compiler libraries need not be reimplemented.

Limit filesystem operations to the selected workspace, validate resolved paths including symlink escapes, and preserve unrelated files. Build/test runners need cancellable processes and reliable teardown. Running plugin code requires an explicit development action in a separate test host; capability declarations are not a security sandbox. Keep third-party/unreviewed code, live account access and native-client installation outside automatic preview reload.

## Acceptance

A reviewer must be able to create/open a sample project, edit and save a file, see a deliberate compile/manifest error linked to its location, correct it, build, run tests, preview, stop/reload and export a package through working controls. Verify unsaved edits, external-change conflicts, workspace path restrictions, failed/cancelled builds and fixture teardown. Inspect rendered workbench screenshots before publication; keep the existing messenger presentation unchanged.

## Delivered acceptance

Eleven workbench behavioral tests cover workspace/symlink boundaries, save conflicts, diagnostics (including external module rejection), builds/packages, test failure/cancellation and preview cleanup. The starter includes the original typed API SDK and tests the compiled plugin's actual resource attachment/removal. Actual source/portable Electron smoke created a project, edited/saved, displayed a deliberate type error, corrected/built/tested, previewed/stopped and exported through the UI. Root inspected rendered desktop/editor/fixture captures. The editor uses native text areas and tabs; no third-party editor library, debugger or Git integration is claimed. Builds/diagnostics are bounded local operations; long-running test processes are cancellable.

The requested adversarial pass expands workbench coverage to twenty-one tests, including real Windows hard links and alternate streams. Windows reports twenty passes and one explicit file-symlink EPERM skip on the local host; Linux separately exercises permitted file symlinks. Preview hardening and synchronous startup recovery receive separate actual Electron regression checks. See [security review](SECURITY_REVIEW.md) for findings, commands and limits; explicit Node tests still execute with the developer's permissions.
