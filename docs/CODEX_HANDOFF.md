# DSI CHAT — Codex continuation

Prepared October 3, 2026. Continue the existing implementation; do not restart the implementation. The user explicitly approved a complete visual redesign to Copperlight Realism.

## Source of truth

- Repository: https://github.com/raiinman/DSI-CHAT
- Active implementation and publishing branch: `codex/dsi-original`.
- Repository default branch `rewrite` preserves the earlier third-party fork. It is NOT the implementation to continue. Do not merge its source/assets into this branch or remove its license notices.
- Copperlight second enhancement reviewed runtime: `147a9b0`; final review-only run `37116008875` passed. Publication evidence is recorded in STATE.md. Subsequent documentation commits may advance the branch without changing runtime files.
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

Current approved art direction: **Copperlight Realism — handcrafted miniature realism**, adapted from the recovered Dead Signal Valley ART-STYLE.md. Its exact GitHub repository was not located; do not invent a repository attribution. The user approved docs/design/copperlight-concept.png and explicitly superseded the former orange-glass visual requirement.

Implement cream plaster surfaces, terracotta ceramic accents, sage navigation and turquoise controls with gentle material texture and warm readable afternoon light. Desktop uses a functional navigation rail, contact list, conversation and selected-contact/station sidebar. Use real HTML controls and an original miniature valley banner. Preserve existing contact identities and DSI mascot. Concept-only calls, file transfer, shared-media grid and OS window buttons are omitted until those actions exist.

Afternoon (day) is the new-visitor/reset default. Night (dark) uses cool sage surfaces; High contrast remains flat black/white/yellow and omits scenic decoration. Retain saved theme choices and all persistence scopes, local behavior and motion choices. Sidebar mirrors the selected contact; responsive layouts keep chat/composer usable at 390/768 and all four contacts visible at 1440x844. History and Contact card remain adjacent. The user-approved second detail pass adds original vector icons, shallow bevels/drop shadows and more color on right-hand buttons. Only the sidebar retains its signal meter and Play/Pause; do not restore the header meter. Keep all decorative depth out of High contrast.

The user requested ImageGen for continued visual refinement. Use it for original artwork when helpful and integrate implementable assets behind real HTML controls. UX Pilot export was a dead end; do not send the user back there. Do not flatten the UI into an image.

## What exists and what does not

Working local preview: fictional contacts, saved favorites/local groups, contextual contact actions, name/note/group search with clearable empty states, conversation tabs, per-contact drafts/messages, presence selection, searchable active-conversation history with local text export, contact cards, local profile name/note editing, emoji insertion, three persisted themes, native preferences/dialogs and responsive layouts. Desktop windows fit ordinary screen heights with internal scrolling.

Messages/drafts are in tab memory and reset on reload. Appearance, local profile and contact organization are saved separately in localStorage. Favorites and group names/membership survive reload; search/filter choices reset. Group collapse is session-only. Profile renaming affects future message authors; older authors remain unchanged. Message/user text renders through textContent.

No connected messaging transport, authentication, account switching, voice/video, file transfers, Android APK or desktop installer exists. Service buttons report preview states; meters are decorative. Do not imply successful connections or live delivery. The downloadable Chromium extension independently implements three original Discord web display features; it does not replace Discord's UI with this shell.

No upstream engines/plugins were vendored into this branch. Prior upstream exposure is documented; do not claim formal clean-room certification, legal clearance or license-free ownership of third-party work. No runtime npm dependencies; Playwright 1.58.2 is CI-only tooling.

## Continue next

The immediate task is continued UI/UX refinement and completion of useful surfaces using the approved Copperlight look. Follow `docs/UI_ROADMAP.md`: contact organization is now delivered; next implement conversation search, reply quoting, copy, clear confirmation and retained reading position; later profile customization and workspace density/text-size settings. Implement a coherent slice, including its persistence and focus behavior where appropriate, rather than adding decorative controls with no action. Actual provider connection work is a separate scope.

## Files and verification

- `site/index.html`, `app.mjs`: shell and main rendering/appearance behavior.
- `site/messenger.mjs`: contact/conversation model.
- `site/workspace-tools.mjs`: history, contact, profile and emoji dialogs.
- `site/contact-book.mjs`, `site/contact-tools.mjs`: validated saved favorites/local groups, search/filter list and organization dialogs.
- `site/style.css`, `themes.css`, `workspace.css`, `panels.css`, `copperlight.css`: layered styles; inspect cascade before adding overrides.
- `site/assets/`: original copperlight valley banner, fox, portrait sheet, historical textures and service SVGs.
- `scripts/browser-qa.mjs`: interactions, theme/motion/contrast, export, focus and layout checks; produces screenshots.

Required local checks: `npm test`, `npm run catalog`, `npm run build`, `node scripts/site.mjs`, `git diff --check`. Contact-organization baseline: 16 tests passing. Do not add implementation-mirroring tests for small visual changes. Run meaningful tests for new behavior.

Use a review branch and dispatch `.github/workflows/pages.yml` with `review_only: true` against it. This builds/tests/screenshots without publishing. Download `dsi-messenger-screenshots`, inspect desktop (especially 1440x844), Dark/Daytime/High contrast and 390/768 views, plus changed dialogs/states. Correct defects before advancing the publishing branch. Preserve composer visibility, all four sample contacts on the ordinary desktop viewport, draft isolation, safe text rendering, native modal focus return and reduced-motion choices.

After review, advance `codex/dsi-original` and publish via its Pages workflow within the already authorized project scope. Check deployment success and public file bytes, not just HTTP 200. Record actual results and any limits in `docs/STATE.md`; retain representative reviewed captures in `docs/design`.

Latest verified Copperlight publication: Pages run https://github.com/raiinman/DSI-CHAT/actions/runs/37115122884 and extension CI run 37115122920. Final review-only run 37114985868 passed. Downloaded and reviewed desktop/phone/tablet/theme/dialog screenshots; public hashes matched all 22 reviewed static files and the ZIP download signature was valid. These are CI Chromium checks against the local preview, not a live Discord account or physical phone.

## Environment caveats

Windows PowerShell, Node 24, git and gh were available. Local Chromium launch worked for the October 3 contact-organization slice, using ignored Playwright 1.58.2 tooling in .cache/browser-qa. QA also passed on GitHub Actions Linux. Re-probe capabilities in a new environment. If inherited proxy variables point to a dead loopback proxy, clear them for the relevant network command. Node HTTPS fetch worked; PowerShell/native curl had TLS issues. Do not print authentication tokens or store them in handoff files. Use the available git credential mechanism; credentials must remain out of logs.

Give concise progress updates and carry the slice through visual review and publication. Ask only for genuinely missing decisions; Michael should not have to repeat the established design.
