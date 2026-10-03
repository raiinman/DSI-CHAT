# Messenger preview

## Purpose
Own the approved Copperlight Realism messenger and its local controls.

## Ownership
- index.html and app.mjs: shell, appearance and rendering.
- messenger.mjs: in-tab conversations, drafts and identity.
- workspace-tools.mjs: archive/export, contact card, profile and emoji dialogs.
- contact-book.mjs and contact-tools.mjs: validated saved favorites/groups and contact list/dialogs.
- style.css, themes.css, workspace.css, panels.css and copperlight.css: layered styles; inspect the cascade before overriding.
- Shipped artwork is delegated to assets/AGENTS.md.

## Local Contracts
- The current second-pass Copperlight UI/UX is locked by user direction (October 3, 2026; reviewed runtime 147a9b0, published source d1fc3e8). Preserve the approved appearance and interactions; further UI/UX changes require explicit user direction.
- The active conversation tab and its dismissal control must stay visible when the strip resizes, including desktop-to-phone changes.
- Use the approved copperlight-concept.png: cream plaster, terracotta accents, sage navigation, turquoise controls, matte reading surfaces and subtle texture. Afternoon is the new-visitor default; retain saved Night and flat High contrast.
- Keep existing contact identities and DSI nine-tailed mascot. The contact details sidebar follows the selected conversation; the station profile remains separate. Do not reintroduce amber glass or decorative portrait arches.
- History and Contact card stay adjacent; Preferences stays outside that pair.
- Keep labeled Discord/Relay/Local controls honest about preview status. The only signal meter is in the station sidebar with its Play/Pause control; remove meters from the conversation header. It is decorative and obeys saved/system motion choices. Use original vector icons, restrained bevels/shadows and distinct colored right-hand actions; keep High contrast flat.
- Messages/drafts remain in tab memory; appearance, profile and contact organization have separate validated localStorage records. Do not silently change persistence/reset scopes.
- Render user/message/group text through textContent. Preserve draft isolation, native modal focus return and useful empty states.

## Work Guidance
Copperlight rail and sidebar shortcuts must perform real navigation/dialog actions and return focus to their opener. The interface work in ../docs/UI_ROADMAP.md is deferred backlog while UI/UX is locked; do not implement another slice without explicit user direction. Implement usable behavior before expanding surfaces. Preserve all four default contacts and composer visibility at 1440x844, plus 390/768 layouts. Treat generated assets as decoration around working HTML controls.

## Verification
Run npm test, catalog/build/site preparation and node scripts/browser-qa.mjs from the repository root. Follow ../docs/VISUAL_WORKFLOW.md for review-only screenshots before publication. Passing interaction tests do not establish visual acceptance.

## Child DOX Index
- [assets/AGENTS.md](assets/AGENTS.md): original shipped artwork and service icons.
