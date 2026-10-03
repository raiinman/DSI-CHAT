# Messenger interface progression

Implement the approved Copperlight Realism concept (October 3 redesign supersedes orange glass). Refine one usable surface at a time; review rendered desktop and mobile states before publishing.

Delivered Copperlight detail pass: original UI icons, shallow bevels/drop shadows, turquoise/terracotta sidebar actions and colored service buttons; single sidebar signal with Play/Pause.

Delivered Copperlight shell: sage navigation rail, cream/terracotta/turquoise afternoon surfaces, sage Night, flat High contrast, original miniature valley banner, readable message bubbles and responsive selected-contact/station sidebar. Existing saved theme choices persist; new visitors and appearance reset use Afternoon.

Delivered workspace: illustrated contacts/tabs, per-conversation drafts, local messaging, three complete themes, optional signal animation, native preferences, searchable active-conversation archive and local text export, contact cards, saved local name/station note, cursor-aware emoji picker, viewport-sized desktop windows.

Next interface work, in order:

1. Delivered October 3: saved contact favorites, editable local groups, contextual contact actions, searchable names/notes/groups, result counts and actionable empty states.
2. Conversation controls: local search in the log, reply quoting, copy message, clear confirmation and retained reading position when switching conversations.
3. Profile customization: original avatar selection, richer custom presence and consistent profile previews.
4. Workspace settings: notification preferences, density and text size, explicit reset scopes and shortcut help.
5. Connection setup: provider-specific screens and loading/error/reconnect states only when an actual authorized adapter exists. Do not simulate successful login, message delivery or calls.

Network messaging, account switching, audio/video and file transfers require separate implementation. The browser shell does not convert the original display extension into a standalone connected messenger. Keep these limits visible in the appropriate flows without filling ordinary conversation controls with implementation details.
