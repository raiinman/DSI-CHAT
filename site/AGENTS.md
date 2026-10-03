# Messenger preview

## Purpose
Own the approved orange-glass broadcast messenger and its local controls.

## Ownership
- index.html and app.mjs: shell, appearance and rendering.
- messenger.mjs: in-tab conversations, drafts and identity.
- workspace-tools.mjs: archive/export, contact card, profile and emoji dialogs.
- contact-book.mjs and contact-tools.mjs: validated saved favorites/groups and contact list/dialogs.
- style.css, themes.css, workspace.css and panels.css: layered styles; inspect the cascade before overriding.
- Shipped artwork is delegated to assets/AGENTS.md.

## Local Contracts
- Preserve the original broadcast station design, matte reading surfaces, Daytime and flat High contrast.
- Keep the tactical chibi nine-tailed fox in a straight rectangular frame; no portrait arch or stacked white title-bar gloss.
- History and Contact card stay adjacent; Preferences stays outside that pair.
- Keep labeled Discord/Relay/Local controls honest about preview status. Signal meters are decorative and obey saved/system motion choices with explicit Play/Pause.
- Messages/drafts remain in tab memory; appearance, profile and contact organization have separate validated localStorage records. Do not silently change persistence/reset scopes.
- Render user/message/group text through textContent. Preserve draft isolation, native modal focus return and useful empty states.

## Work Guidance
Follow ../docs/UI_ROADMAP.md; conversation search/reply/copy/clear confirmation/reading position are next. Implement usable behavior before expanding surfaces. Preserve all four default contacts and composer visibility at 1440x844, plus 390/768 layouts. Treat generated assets as decoration around working HTML controls.

## Verification
Run npm test, catalog/build/site preparation and node scripts/browser-qa.mjs from the repository root. Follow ../docs/VISUAL_WORKFLOW.md for review-only screenshots before publication. Passing interaction tests do not establish visual acceptance.

## Child DOX Index
- [assets/AGENTS.md](assets/AGENTS.md): original shipped artwork and service icons.
