# DSI CHAT — Codex continuation

Prepared October 3, 2026. Continue the existing implementation; do not restart the implementation. The Copperlight redesign and second enhancement pass are delivered. The user locked the current UI/UX on October 3, 2026.

## Source of truth

- Repository: https://github.com/raiinman/DSI-CHAT
- Active implementation and publishing branch: `codex/dsi-original`.
- Repository default branch `rewrite` preserves the earlier third-party fork. It is NOT the implementation to continue. Do not merge its source/assets into this branch or remove its license notices.
- Copperlight second enhancement reviewed runtime: `147a9b0`; published source: `d1fc3e8`. Final review-only run `37116008875`, Pages `37116155328` and extension CI `37116155402` passed. Public hashes match all 23 reviewed static files. Subsequent documentation commits may advance the branch without changing runtime files.
- Live preview: https://raiinman.github.io/DSI-CHAT/
- Current workspace checkout: `C:\Users\mikea\OneDrive\Documents\ChatGPT\DSI-CHAT`. The earlier checkout at `C:\Users\mikea\Documents\Codex\2026-09-30\new-chat-3\DSI-CHAT-original` is preserved; its ignored tool/reference caches are not automatically present in the new workspace.

Check working-tree changes before fetching. Fetch the active branch and fast-forward only when safe; preserve unrelated user work. Refresh GitHub state rather than assuming these revisions are still latest.

## Read before editing

1. Root `AGENTS.md`, then follow its DOX Child Index and read every applicable parent/child instruction along each edited path. After meaningful changes, update the closest owning instructions and affected indexes. DOX is installed; attribution and its MIT license are recorded in `docs/PROVENANCE.md` and `docs/DOX_LICENSE.txt`.
2. `README.md`.
3. `docs/ARCHITECTURE.md`.
4. `docs/STATE.md` (historical entries remain; latest entries supersede earlier ones).
5. `docs/PROVENANCE.md`.
6. `docs/IMPLEMENTATION_PLAN.md`, `docs/TOOLCHAIN.md` and `docs/REFERENCE_SOURCES.json` for the authorized original engine/platform direction and prepared tools.
7. `docs/VISUAL_WORKFLOW.md`, `docs/UI_ROADMAP.md`, `docs/DESIGN.md` and `docs/USABILITY.md` if present.

## User direction to preserve

The user clarified and confirmed: build one original DSI Discord mod bringing together capabilities and ideas from Vencord, Equicord, Vendetta and Revenge. Do not merge or vendor their engines/plugins. Implement DSI's own shared plugin contract and platform adapters. Planning/tool preparation is authorized; follow IMPLEMENTATION_PLAN.md for the first engine sprint. The user also requested a separate DSI developer IDE; read IDE_WORKBENCH.md and retain its milestone after the plugin contract/browser fixtures. A standalone messaging server is outside this direction.

Current approved art direction: **Copperlight Realism — handcrafted miniature realism**, adapted from the recovered Dead Signal Valley ART-STYLE.md. Its exact GitHub repository was not located; do not invent a repository attribution. The user approved docs/design/copperlight-concept.png and explicitly superseded the former orange-glass visual requirement.

Preserve cream plaster surfaces, terracotta ceramic accents, sage navigation and turquoise controls with gentle material texture and warm readable afternoon light. Desktop uses a functional navigation rail, contact list, conversation and selected-contact/station sidebar. Use real HTML controls and an original miniature valley banner. Preserve existing contact identities and DSI mascot. Concept-only calls, file transfer, shared-media grid and OS window buttons are omitted until those actions exist.

Afternoon (day) is the new-visitor/reset default. Night (dark) uses cool sage surfaces; High contrast remains flat black/white/yellow and omits scenic decoration. Retain saved theme choices and all persistence scopes, local behavior and motion choices. Sidebar mirrors the selected contact; responsive layouts keep chat/composer usable at 390/768 and all four contacts visible at 1440x844. History and Contact card remain adjacent. The user-approved second detail pass adds original vector icons, shallow bevels/drop shadows and more color on right-hand buttons. Only the sidebar retains its signal meter and Play/Pause; do not restore the header meter. Keep all decorative depth out of High contrast.

UI/UX is currently locked, including its artwork and interactions. If the user explicitly reopens visual refinement, use ImageGen for useful original artwork and integrate implementable assets behind real HTML controls. UX Pilot export was a dead end; do not send the user back there. Do not flatten the UI into an image.

## What exists and what does not

Working local preview: fictional contacts, saved favorites/local groups, contextual contact actions, name/note/group search with clearable empty states, conversation tabs, per-contact drafts/messages, presence selection, searchable active-conversation history with local text export, contact cards, local profile name/note editing, emoji insertion, three persisted themes, native preferences/dialogs and responsive layouts. Desktop windows fit ordinary screen heights with internal scrolling.

Messages/drafts are in tab memory and reset on reload. Appearance, local profile and contact organization are saved separately in localStorage. Favorites and group names/membership survive reload; search/filter choices reset. Group collapse is session-only. Profile renaming affects future message authors; older authors remain unchanged. Message/user text renders through textContent.

No connected messaging transport, authentication, account switching, voice/video, file transfers or signed desktop installer exists. Native development APKs and a Windows portable host/workbench now exist; they are distinct from the messenger preview. Service buttons report preview states; meters are decorative. Do not imply successful connections or live delivery. The downloadable Chromium extension independently implements twelve original browser/Windows display plugins; it does not replace Discord's UI with this shell.

No upstream engines/plugins were vendored into this branch. Prior upstream exposure is documented; do not claim formal clean-room certification, legal clearance or license-free ownership of third-party work. No external npm runtime dependencies in the site/extension; Windows includes Electron and workbench compilers with their notices. Pinned devDependencies now provide TypeScript 5.9.3, esbuild 0.28.2 and Playwright 1.58.2; browser CI uses root-installed pinned Playwright. Android command-line/platform tools are prepared portably; native lab/bootstrap builds and a Linux emulator verification workflow are implemented.

## Continue next

Latest Windows repair: v0.4.0-dev.4, runtime67adea1/sourceb0dd539. It fixes the blank startup caused by the nonwritable media entry point; compatible instance wrappers now delegate to the immutable native-prototype guard. Public empty-profile login renders with zero exceptions; signed-in acceptance remains pending. Browser/Linux37164722666 and Windows37164720621 pass. Exact ZIP/public-assets/install hashes and both shortcuts are verified. The dashboard was opened only after confirming no old DSI processes remained. See the top of STATE.md; v0.4.0-dev.3 below is the previous release.

Current publication: v0.4.0-dev.3, release source8fb3e56 and reviewed runtime7e90b8d. Pages37163634316 and exact public release/site/extension bytes pass. Its separate per-user install and both owned shortcuts are verified; six old processes and the call remain untouched. After the call, close old DSI and reopen the shortcut. Full closeout is at the top of STATE.md; v0.4.0-dev.2 references below describe the previous release.

Current reviewed release: original Copperlight screen picker plus early public-media guard and centralized application permissions. Read docs/PERMISSIONS.md and security/AGENTS.md; all application permission defaults belong in security/permissions.json, and browser/Android package scopes are generated from it. Unknown/unsafe rules fail closed. Guarded modern capture requires registration/verification before official scripts, current origin/frame/document and explicit local selection; legacy capture remains denied by a JavaScript guard, not a native boundary. Live Discord/camera delivery remains unverified. Final runtime7e90b8d passed browser/Linux37162839792, Windows/native37162839785, Manager37162839802 and Pages review37162841407. Release v0.4.0-dev.3 supersedes the previous Windows release; exact publication/install evidence belongs at the top of STATE.md. Preserve running calls and installed profiles during staging.

Latest published Windows update: v0.4.0-dev.2, release source7c48988/runtime977f0ba. Review37157846447/37157848822/37157851162 and original-branch publication37158351378/37158351352/37158351411 pass. Public release assets and all23 site/seven extension payload hashes match reviewed bytes. The exact246-payload ZIP is installed separately with Desktop/Start Menu shortcuts updated; existing DSI processes/call were left running. After finishing the call, close old DSI and use its shortcut to open the new version. Retest larger text/Safe mode and camera in the owned acceptance destination. Screen sharing uses the explicit normal-browser fallback until an enforceable embedded source gate exists. See STATE.md for exact hashes and evidence.

The user explicitly reopened launcher/IDE visuals after rejecting their green palette, and prioritized camera plus screen sharing with Jade. Tools now use Copperlight cream/sage/terracotta/turquoise; the messenger remains locked. Windows display attachment now uses removable host-owned author-origin CSS under unchanged CSP. Semantic-main/media selectors are corrected, numeric edits enable their plugin, and status reports runtime startup/context rather than asserting effects. The strict-CSP semantic fixture reproduces the prior failure and validates the fix. The camera identity change still requires a live retest. Stable Electron44 and an isolated45alpha probe both permit legacy capture to bypass an unguarded picker. The current candidate adds a verified early public-media guard and local Copperlight picker; without these gates retain capture denial. An explicit launcher button opens the official Discord URL in the default browser for native browser screen sharing, with separate login and no automatic call/capture. Never restart the installed host while the user is on a call; stage the reviewed update and let them switch afterward.

Current next phase: read LIVE_INTEGRATION_PLAN.md for root-plus-one-partner real-client work and a per-platform acceptance ledger. The user authorized their live account and the owned raiinman server; DSI Testing / #dsi-acceptance now exists. Native browser send/edit/reply/reaction/delete baseline passed without DSI. After explicit per-user Windows setup/open, the user supplied genuine v0.4.0-dev.1 messaging/navigation screenshots and reported live voice connected with good audio. Camera/video gives Discord's unsupported-browser modal; screen capture is independently blocked. Enabled-plugin comparisons and comprehensive parity remain pending. Private screenshots stay local, outside Git/CI. Open-source license selection remains pending.

The browser presence inspector adds no permissions or text/identifier collection and always marks effects/parity unverified. Windows adds scoped microphone/camera approval, confirmed HTTPS links and host reload/recovery. Screen capture without the early guard/picker remains blocked after controlled testing demonstrated a legacy chooser bypass. Never grant blanket capture permissions without those independent gates. Final review/publication evidence follows in STATE.md.

Camera follow-up changes only the official window's browser identification, retaining actual Chromium/OS version while removing known shell product tokens. Fake camera/local WebRTC transport and scoped identity tests do not prove the live Discord UI gate is resolved. Stage updates separately; do not restart the user's running call without their readiness. Preserve the per-user installed profile and both previous release/install versions.

The user authorized a separate phone-only DSI Manager and built-in updater. Read docs/MANAGER_PLAN.md and android/manager/AGENTS.md plus README.md before work. Its first payload is the original native sample; actual Discord setup stays explicitly unavailable. Normal setup must not require a PC/ADB/file picker. Preserve PackageInstaller approval, stable private signing identity, fixed HTTPS update feed and integrity/version/package/signer gates. The locked messenger remains unchanged. Manager candidate and actual acceptance/publication evidence are recorded in STATE.md.

The current UI/UX is locked. Preserve the published second enhancement baseline (`147a9b0` reviewed runtime; `d1fc3e8` published source), including its layout, themes, icons, depth, colored right-hand controls, single sidebar signal and existing interactions. Do not automatically implement another UI slice. `docs/UI_ROADMAP.md` retains conversation controls, profile customization and workspace settings as deferred backlog requiring explicit user direction to reopen UI/UX work. The user selected the original engine/platform direction. The foundation and adapters now exist; follow `docs/IMPLEMENTATION_PLAN.md` for manifest/capability contracts, registry/lifecycle, failure isolation, settings migration and adaptation of the three existing features. Keep reference identifiers distinct from delivered functionality. Desktop/native-mobile support requires its own tested adapters; do not treat a WebView wrapper as native mod parity.

## Files and verification

- `site/index.html`, `app.mjs`: shell and main rendering/appearance behavior.
- `site/messenger.mjs`: contact/conversation model.
- `site/workspace-tools.mjs`: history, contact, profile and emoji dialogs.
- `site/contact-book.mjs`, `site/contact-tools.mjs`: validated saved favorites/local groups, search/filter list and organization dialogs.
- `site/style.css`, `themes.css`, `workspace.css`, `panels.css`, `copperlight.css`: layered styles; inspect cascade before adding overrides.
- `site/assets/`: original copperlight valley banner, fox, portrait sheet, historical textures and service SVGs.
- `scripts/browser-qa.mjs`: interactions, theme/motion/contrast, export, focus and layout checks; produces screenshots.

Developer setup: `npm ci --ignore-scripts`, `npm run tools:setup`, `npm run tools:doctor`; add `-- --android` for the prepared portable Windows tools. Tooling instructions/pins and deferred native prerequisites are in `docs/TOOLCHAIN.md`.

Required local checks: `npm test`, `npm run catalog`, `npm run build`, `node scripts/site.mjs`, `git diff --check`. Current root baseline:46 tests passing; workbench/native suites are separate. Do not add implementation-mirroring tests for small visual changes. Run meaningful tests for new behavior.

Use a review branch and dispatch `.github/workflows/pages.yml` with `review_only: true` against it. This builds/tests/screenshots without publishing. Download `dsi-messenger-screenshots`, inspect desktop (especially 1440x844), Dark/Daytime/High contrast and 390/768 views, plus changed dialogs/states. Correct defects before advancing the publishing branch. Preserve composer visibility, all four sample contacts on the ordinary desktop viewport, draft isolation, safe text rendering, native modal focus return and reduced-motion choices.

After review, advance `codex/dsi-original` and publish via its Pages workflow within the already authorized project scope. Check deployment success and public file bytes, not just HTTP 200. Record actual results and any limits in `docs/STATE.md`; retain representative reviewed captures in `docs/design`.

Latest verified Copperlight second enhancement publication: Pages run https://github.com/raiinman/DSI-CHAT/actions/runs/37116155328 and extension CI run 37116155402. Final review-only run 37116008875 passed. Reviewed desktop/phone/tablet/theme captures; public hashes matched all 23 static files and the ZIP signature was valid. Only the sidebar retains the signal and saved Play/Pause. These are local-preview Chromium checks, not a live Discord account or physical phone.

## Environment caveats

Windows PowerShell, Node 24, git and gh were available. Local Chromium launch worked for the October 3 contact-organization slice, using ignored Playwright 1.58.2 tooling in .cache/browser-qa. QA also passed on GitHub Actions Linux. Re-probe capabilities in a new environment. If inherited proxy variables point to a dead loopback proxy, clear them for the relevant network command. Node HTTPS fetch worked; PowerShell/native curl had TLS issues. Do not print authentication tokens or store them in handoff files. Use the available git credential mechanism; credentials must remain out of logs.

Give concise progress updates and carry the slice through visual review and publication. Ask only for genuinely missing decisions; Michael should not have to repeat the established design.

## Original multi-platform development release

The API1 engine and v2 settings live in src/plugins/; twelve built-ins have reversible resource ownership, capability/dependency/conflict gates and controlled real-extension QA. Legacy three-feature modules still power the locked preview. desktop/ owns the portable Electron host; workbench/ owns working plugin edit/diagnose/build/test/preview/export. android/ owns native lab/three handlers and non-root local APK bootstrap/patcher. Read their indexed AGENTS/README files before changes.

The user selected ordinary non-root phones. No Discord APK or account was used. Preserve explicit local input/output boundaries and development-signing limits. Root browser tests pass35, workbench tests11 and native lifecycle assertions17; APK patch acceptance and packaged Windows smoke pass. Final platform CI37129732815 passed Windows, Android builds and both monolithic/configuration-split emulator routes. Root inspected final browser, native and source/packaged Windows captures. Published development release v0.2.0-dev.1 from source a72b05f on codex/dsi-original. Pages37130201566 passed; all23 static public files and seven extension ZIP payload hashes match review. Seven release asset hashes/sizes verified. Workflow5a439d6 complete platform rerun37129940176 also passed. See STATE.md for limits and release link. Do not turn fixture success into a full-client or hundreds-of-plugins claim.

Latest original development release: https://github.com/raiinman/DSI-CHAT/releases/tag/v0.2.0-dev.1. Continue the current codex/dsi-original checkout; the review branch is retained for audit. No Discord APK/account/physical phone was used. Obtain Discord from the official Play store and use android/export-apks.ps1 with an explicitly chosen authorized serial; single exported APK uses patch-apk.ps1, configuration sets use patch-set.ps1. Do not imply live Discord compatibility until this separate acceptance is performed.

Revenge added by user: pinned fourth capability reference revenge-mod/revenge-bundle at1b1d297416594087769987908e5fc09af36b7e6e. Read IMPLEMENTATION_PLAN.md Revenge addition before next Android work: distinguish JavaScript bundle from separate non-root Manager loader; prioritize original controlled host-runtime attachment, lifecycle/recovery, then mobile themes/fonts/available host controls. Current native fixture acceptance does not prove React Native host access. No upstream source/bundle/loader is imported; original implementation and Copperlight lock remain.

Latest Manager/Windows release: [v0.3.0-dev.2](https://github.com/raiinman/DSI-CHAT/releases/tag/v0.3.0-dev.2), reviewed source8d55cad with unchanged Android runtime3a64c8b. Original/browser/Linux CI [37140088982](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088982), complete Windows/native platform CI [37140088988](https://github.com/raiinman/DSI-CHAT/actions/runs/37140088988) and Manager adversarial CI [37139689797](https://github.com/raiinman/DSI-CHAT/actions/runs/37139689797) passed. Read SECURITY_REVIEW.md for the user's requested controlled red-team findings/fixes and regression commands. Manager versionCode2 retains the stable local signing identity and preserves failed update checks across restart. Windows includes hardened preview transport/workspace paths and recovered cancellation/startup. Both artifacts and exact public bytes were verified; public-feed/publication closeout is in STATE.md.

One normal Manager APK embeds the original sample and includes verified user-approved self-updates. Actual Discord setup remains unavailable. Read android/manager/README.md and updates/AGENTS.md; preserve both private Android signing keys across cleanup. Reviewed native and adversarial captures are in docs/design. Local release APK and CI QA builds use different signing identities; do not publish CI-generated Manager APKs over the stable local release. Continue original real-client host/attachment work separately from this delivered installer slice. Keep the Copperlight messenger locked and the preserved rewrite branch untouched.
