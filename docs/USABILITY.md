# Messenger usability review

The full messenger uses charcoal surfaces and orange emphasis. The classic contact-and-conversation structure is retained. No blue starting theme remains.

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

Browser QA runs on the GitHub Linux runner against a local static build. Screenshots cover 1440, 768 and 390 pixel widths plus preferences. It also checks literal text rendering, history isolation, presence controls, reduced motion, keyboard tab selection and closure. It does not access a live Discord account.

Remaining limits: contacts and presence are sample data; messages are in tab memory; no remote transport, unread notifications, file transfers or calls are implemented. Firefox, screen-reader sessions and real-device keyboard behavior have not been validated.
