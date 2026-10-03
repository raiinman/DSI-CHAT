# DSI CHAT — Codex continuation

Prepared October 3, 2026. Continue the existing implementation; do not restart or redesign it from scratch.

## Source of truth

- Repository: https://github.com/raiinman/DSI-CHAT
- Active implementation and publishing branch: `codex/dsi-original`.
- Repository default branch `rewrite` preserves the earlier third-party fork. It is NOT the implementation to continue. Do not merge its source/assets into this branch or remove its license notices.
- Contact organization reviewed runtime: `005c2b4`; published source: `2dd87fa`. Subsequent documentation commits may advance the branch without changing public files.
- Live preview: https://raiinman.github.io/DSI-CHAT/
- Existing local checkout: `C:\Users\mikea\Documents\Codex\2026-09-30\new-chat-3\DSI-CHAT-original`.

Check working-tree changes before fetching. Fetch the active branch and fast-forward only when safe; preserve unrelated user work. Refresh GitHub state rather than assuming these revisions are still latest.

## Read before editing

1. Root `AGENTS.md`, then follow its DOX Child Index and read every applicable parent/child instruction along each edited path. After meaningful changes, update the closest owning instructions and affected indexes. DOX is installed; attribution and its MIT license are recorded in `docs/PROVENANCE.md` and `docs/DOX_LICENSE.txt`.
2. `README.md`.
3. `docs/ARCHITECTURE.md`.
4. `docs/STATE.md` (historical entries remain; latest entries supersede earlier ones).
5. `docs/PROVENANCE.md`.
6. `docs/VISUAL_WORKFLOW.md`, `docs/UI_ROADMAP.md`, `docs/DESIGN.md` and `docs/USABILITY.md` if present.

## User direction to preserve

DSI CHAT is an original broadcast-station messenger inspired by the compact two-window feel of Trillian Astra 4.2. It must not become a Discord-shaped interface or a literal Trillian clone. Preserve orange/amber glass chrome, dark charcoal interiors, a complete Daytime theme and flat High contrast. The mascot is the existing tactical chibi nine-tailed fox, not an excessively cute replacement or the humanoid fox from an early concept.

Approved concept: `docs/design/orange-glass-concept.png`. Latest reviewed implementation: `docs/design/contact-organization-desktop.png` (soft-glass chrome retained). Compare both; the implementation capture reflects later explicit user corrections. Keep a straight rectangular profile portrait: no half-circle or arch. Keep legible, labeled Discord/Relay/Local controls. Keep optional animated signal meters with Play/Pause and reduced-motion behavior.

Recent explicit corrections: Appearance beside Contact card is removed; Preferences remains accessible elsewhere. History and Contact card stay adjacent. The white line in title bars was rejected. The fix disables the extra `::after` gloss layer and crops below the generated texture's bright streak; do not reintroduce stacked white highlights. Refine with rendered screenshots, not assertions that passing tests prove beauty.

The user requested ImageGen for continued visual refinement. Use it for original artwork when helpful and integrate implementable assets behind real HTML controls. UX Pilot export was a dead end; do not send the user back there. Do not flatten the UI into an image.

## What exists and what does not

Working local preview: fictional contacts, saved favorites/local groups, contextual contact actions, name/note/group search with clearable empty states, conversation tabs, per-contact drafts/messages, presence selection, searchable active-conversation history with local text export, contact cards, local profile name/note editing, emoji insertion, three persisted themes, native preferences/dialogs and responsive layouts. Desktop windows fit ordinary screen heights with internal scrolling.

Messages/drafts are in tab memory and reset on reload. Appearance, local profile and contact organization are saved separately in localStorage. Favorites and group names/membership survive reload; search/filter choices reset. Group collapse is session-only. Profile renaming affects future message authors; older authors remain unchanged. Message/user text renders through textContent.

No connected messaging transport, authentication, account switching, voice/video, file transfers, Android APK or desktop installer exists. Service buttons report preview states; meters are decorative. Do not imply successful connections or live delivery. The downloadable Chromium extension independently implements three original Discord web display features; it does not replace Discord's UI with this shell.

No upstream engines/plugins were vendored into this branch. Prior upstream exposure is documented; do not claim formal clean-room certification, legal clearance or license-free ownership of third-party work. No runtime npm dependencies; Playwright 1.58.2 is CI-only tooling.

## Continue next

The immediate task is continued UI/UX refinement and completion of useful surfaces while preserving the approved look. Follow `docs/UI_ROADMAP.md`: contact organization is now delivered; next implement conversation search, reply quoting, copy, clear confirmation and retained reading position; later profile customization and workspace density/text-size settings. Implement a coherent slice, including its persistence and focus behavior where appropriate, rather than adding decorative controls with no action. Actual provider connection work is a separate scope.

## Files and verification

- `site/index.html`, `app.mjs`: shell and main rendering/appearance behavior.
- `site/messenger.mjs`: contact/conversation model.
- `site/workspace-tools.mjs`: history, contact, profile and emoji dialogs.
- `site/contact-book.mjs`, `site/contact-tools.mjs`: validated saved favorites/local groups, search/filter list and organization dialogs.
- `site/style.css`, `themes.css`, `workspace.css`, `panels.css`: layered styles; inspect cascade before adding overrides.
- `site/assets/`: original fox, background, portrait sheet, amber texture and service SVGs.
- `scripts/browser-qa.mjs`: interactions, theme/motion/contrast, export, focus and layout checks; produces screenshots.

Required local checks: `npm test`, `npm run catalog`, `npm run build`, `node scripts/site.mjs`, `git diff --check`. Contact-organization baseline: 16 tests passing. Do not add implementation-mirroring tests for small visual changes. Run meaningful tests for new behavior.

Use a review branch and dispatch `.github/workflows/pages.yml` with `review_only: true` against it. This builds/tests/screenshots without publishing. Download `dsi-messenger-screenshots`, inspect desktop (especially 1440x844), Dark/Daytime/High contrast and 390/768 views, plus changed dialogs/states. Correct defects before advancing the publishing branch. Preserve composer visibility, all four sample contacts on the ordinary desktop viewport, draft isolation, safe text rendering, native modal focus return and reduced-motion choices.

After review, advance `codex/dsi-original` and publish via its Pages workflow within the already authorized project scope. Check deployment success and public file bytes, not just HTTP 200. Record actual results and any limits in `docs/STATE.md`; retain representative reviewed captures in `docs/design`.

Latest verified publication: Pages run https://github.com/raiinman/DSI-CHAT/actions/runs/37112540971 and extension CI run 37112541018. Review-only run 37112413389 passed. Public hashes matched reviewed HTML/styles/modules/artwork. These were CI Chromium checks against the local preview, not testing a live Discord account or a physical phone.

## Environment caveats

Windows PowerShell, Node 24, git and gh were available. Local Chromium launch worked for the October 3 contact-organization slice, using ignored Playwright 1.58.2 tooling in .cache/browser-qa. QA also passed on GitHub Actions Linux. Re-probe capabilities in a new environment. If inherited proxy variables point to a dead loopback proxy, clear them for the relevant network command. Node HTTPS fetch worked; PowerShell/native curl had TLS issues. Do not print authentication tokens or store them in handoff files. Use the available git credential mechanism; credentials must remain out of logs.

Give concise progress updates and carry the slice through visual review and publication. Ask only for genuinely missing decisions; Michael should not have to repeat the established design.
