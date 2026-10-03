# Unit and adapter checks

## Purpose
Verify stable behavior of the original runtime and local messenger models.

## Ownership
- core.test.mjs: settings validation, lifecycle, safe mode and failure isolation.
- browser.test.mjs: owned style cleanup, manifest scope and stale storage reads.
- messenger.test.mjs: conversations, drafts, composition and author identity.
- contact-book.test.mjs: persisted data repair, group edits/removal and favorites.
- plugins.test.mjs and plugin-adapter.test.mjs: manifests, lifecycle/resources/races, dependency/conflict/capability gates and versioned storage migration.
- Rendered interactions belong to scripts/browser-qa.mjs.

## Local Contracts
Tests use Node's built-in test/assert APIs. Prefer behavioral contracts over implementation-mirroring assertions. Do not test against or modify a live Discord account.

## Work Guidance
Add meaningful tests for new behavior and regressions; small reversible visual changes do not need redundant unit tests. Keep unit tests distinct from screenshot acceptance.

## Verification
npm test runs node --test --test-isolation=none tests/*.test.mjs; current baseline is 35 passing checks; separate workbench/native suites have their own owning guides. Update evidence in docs/STATE.md after meaningful changes.

## Child DOX Index
None.
