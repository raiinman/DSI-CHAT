# Central permissions policy

## Purpose
Own the single inspectable source of default DSI permissions, security/permissions.json.

## Ownership
- permissions.json: Discord devices/capture/external navigation, local IPC roles, picker approval/limits, preview transport, browser manifest/capabilities and Android native permissions/update origins.
- policy.mjs: strict schema validation and pure platform-neutral JavaScript decisions. No silent fallback defaults or user-content logging.

## Local Contracts

- android-build.mjs: generated Lab/Manager manifests and production/controlled-QA Manager update constants; no device contact.
- Unknown permission decisions and unknown policy fields fail closed. This file does not grant arbitrary plugin code an OS sandbox.
- Required source/window/frame identity, approval, same-signer and integrity safeguards cannot be disabled through policy edits. New supported rules require a validator and enforcement path with meaningful acceptance tests.
- Tightening supported lists/hosts/limits changes the adapters' next build/start behavior. Editing a repository policy does not remotely change an already installed release or bypass native OS permission approval.
- Browser/native manifests and compiled Manager configuration are generated from this policy; platform code enforces rules but must not introduce its own permission defaults.
- Picker names/thumbnails stay in local memory; no remote page, logs, public screenshots or retained report may receive private source previews. Native stream titles are redacted; the standard API still exposes the selected capture identifier, which must stay out of public evidence.

## Work Guidance
Keep rules understandable and grouped by platform/surface. Record where each rule is enforced in the owning platform documentation.

## Verification
Run root tests and existing browser/Windows/native suites for affected enforcement paths. Permission schema, narrowing rules, source/window scope and cancellation must fail safely.

## Child DOX Index
None.
