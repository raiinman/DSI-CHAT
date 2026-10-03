# Messenger usability review

The current messenger uses Copperlight Realism: cream Afternoon by default, sage Night and flat High contrast. Existing saved theme choices are retained. The October 3 approved redesign supersedes earlier visual requirements in the historical findings below. Navigation and contact-sidebar shortcuts operate existing dialogs, preserve focus return and reflect the active contact. Reading surfaces use bounded message bubbles; the composer remains visible on ordinary desktop displays.

| Finding | Change | Verification |
| --- | --- | --- |
| Drafts followed the user into another conversation | Store drafts per contact; restore on tab changes and reopening | Unit tests and Chromium interaction check |
| Preferences left focus in the page behind the panel | Native modal dialog; Escape dismisses; focus returns to the opener | Chromium interaction check |
| Small text and controls made scanning and tapping difficult | Larger body text, contact rows, buttons, checkboxes and input text | Desktop, tablet and phone screenshots |
| Blank messages had an active Send button | Disable Send until input contains text | Chromium interaction check |
| Search could hide results inside a collapsed group | Expand matching groups during a nonempty search | Source review and search check |
| Newly opened conversations appeared broken when empty | Show a useful empty-conversation instruction | Source review |
| Mobile chat made returning to contacts awkward | Add a Contacts shortcut that scrolls and focuses search | Chromium interaction check |
| Active tabs could be outside the visible tab strip | Scroll the strip horizontally to the selected tab | Source review |
| Safe mode could be mistaken for a light-theme reset | Base dark messenger is independent of optional features | Screenshot and safe-mode check |
| Muddy gradient and decorative arch distracted from the profile | Continuous surface with simple portrait frame; rebuilt compact portrait/status/services block | Desktop and phone screenshots |
| D/R/L badges were tiny and looked identical | Larger, labeled badges with different shapes/colors and preview-status actions | Service-button checks and screenshots |
| Animation became hard to notice | Larger signal meter and gentle portrait outline pulse | Default animation, saved Reduced motion and system motion checks |
| High contrast only altered some accents; no daytime theme existed | Three full themes with persisted selection, available in safe mode | Theme reloads, screenshots, sampled text contrast and overflow checks |
| Signal was hard to see or could remain paused by saved motion choices | Large equalizers in profile and conversation header; direct persistent Play/Pause, with explicit opt-in under system reduced motion | Actual transform change, saved pause and system-motion interaction checks |
| Conversation text lacked a clear reading order | Author/time column on desktop, stacked headings on phones, matte message paper | Theme and responsive screenshots |

Browser QA runs on the GitHub Linux runner against a local static build. Screenshots cover all three themes at 1440, 768 and 390 pixel widths plus preferences. It checks selected normal text/surface pairs at a minimum 4.5:1 for Dark/Daytime and 7:1 for High contrast, plus removal of decorative high-contrast gradients. These sampled checks are not a comprehensive accessibility certification. It also checks literal text rendering, history isolation, presence controls, reduced motion, keyboard tab selection and closure. It does not access a live Discord account.

Remaining limits: contacts and presence are sample data; messages are in tab memory; no remote transport, unread notifications, file transfers or calls are implemented. Firefox, screen-reader sessions and real-device keyboard behavior have not been validated.

Concept-fidelity revision: composer field/emoji/Send now share a compact row, service controls have geometric icons and labels, and desktop messages use time/author/body columns. The portrait is static; equalizers provide the optional motion. Prepublication screenshot review caught a title-bar reflection escaping its container, theme specificity selecting the same portrait for all contacts, and a faint disabled Send label in Daytime. These were corrected; containment and four distinct portrait positions are now checked in browser QA. Passing usability checks alone does not establish visual acceptance.

Workspace expansion: History opens a searchable archive with an explicit local text export and empty results state. Contact cards expose sample presence and connection status, with Write a message returning focus to the composer. Edit profile changes the saved local display name and station note; existing message authors are preserved. The emoji picker inserts at the current selection and preserves the draft. Viewport-sized desktop windows keep the composer visible and scroll contacts/messages internally. All added surfaces use native dialog Escape/focus behavior and full themes. No remote connection, login, calls or file-transfer controls are implied by these additions.

Contact organization adds a Favorites filter, per-row labeled actions, favorite/group editing and a local group manager with create/rename/remove. Search also matches status notes and group names, with result counts and a clear-search/filter action. Empty favorites and search results provide distinct guidance, with a small decorative receiver illustration. New native modals use theme tokens and explicit focus return. Removing a custom group preserves its contacts, favorites, conversations and drafts. Appearance reset does not reset contact organization.

Copperlight screenshot review corrected the selected-tab position on viewport resize: the strip keeps the current conversation in view as its available width changes.
