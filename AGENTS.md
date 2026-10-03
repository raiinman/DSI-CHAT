# DSI CHAT original implementation

Read README.md, docs/ARCHITECTURE.md, docs/STATE.md and docs/PROVENANCE.md before edits.
This branch implements DSI's own code. Do not import source, assets, plugins, APIs or build systems from the preserved fork.
Implement from behavior requirements and documented browser/platform APIs.
Record source provenance and all dependencies. Never remove notices from third-party code.
Prior exposure to upstream sources is documented; do not claim a formally isolated clean-room process or legal clearance.
Keep development local until instructed to install or interact with a live account.
Run tests, catalog generation and build after runtime changes. Record actual results.
The browser prototype is not an Android APK, desktop injector or full plugin-suite replacement.

## Project continuation

Continue on codex/dsi-original; preserve existing work and implement the approved Copperlight Realism messenger. Read docs/CODEX_HANDOFF.md and its required documents before implementation edits. Follow docs/UI_ROADMAP.md; the current slice is the user-approved Copperlight redesign; conversation controls follow. The UI roadmap supports the original Discord customization project; connection/platform work remains separate scope.

## Documentation framework provenance

The DOX instructions below are adapted from https://github.com/raiinman/dox at 765ae4ac02cc884eefcd41a3d0f71941721adb89. Copyright (c) 2026 Agent Zero; MIT license retained in docs/DOX_LICENSE.txt. DOX governs documentation only and adds no runtime dependency or license grant for DSI source.

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md.

- Continue the documented UI roadmap and approved design; do not substitute a platform pivot without explicit user direction.
- Give concise progress updates and complete authorized work through validation, visual review and publication when applicable.

## Child DOX Index

Root owns README.md, NOTICE.md, package.json, .gitignore, project-wide direction, branch selection and cross-area contracts. Ignored .cache/, dist/ and release/ are temporary/generated outputs; .git/ is repository metadata. Do not create DOX trees inside these directories.

- [src/AGENTS.md](src/AGENTS.md): shared feature runtime and Chromium JavaScript adapters.
- [browser/AGENTS.md](browser/AGENTS.md): extension manifest and popup presentation.
- [site/AGENTS.md](site/AGENTS.md): messenger preview behavior, themes and UI assets.
- [scripts/AGENTS.md](scripts/AGENTS.md): catalog/build/site preparation and browser QA tooling.
- [tests/AGENTS.md](tests/AGENTS.md): existing unit and adapter verification.
- [catalog/AGENTS.md](catalog/AGENTS.md): generated feature catalog.
- [docs/AGENTS.md](docs/AGENTS.md): architecture, roadmap, handoff, evidence and provenance.
- [.github/AGENTS.md](.github/AGENTS.md): verification and Pages workflows.
