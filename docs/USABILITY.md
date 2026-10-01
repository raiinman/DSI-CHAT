# Messenger usability review

The default messenger uses charcoal surfaces and orange glass. Daytime and High contrast are complete alternate themes. The classic contact-and-conversation structure is retained. No blue starting theme remains.

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
