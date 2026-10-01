# Concept implementation and acceptance

The user's approved reference is [orange-glass-concept.png](design/orange-glass-concept.png). UX Pilot output is not the target. Earlier screenshots demonstrated functioning controls but did not establish visual fidelity; the user rejected that result.

| Area | Required visual behavior |
| --- | --- |
| Desktop composition | Two adjacent framed windows; contact pane approximately 29% of workspace width |
| Chrome | Bright amber perimeter, reflective upper edge, dark lower glass; no muddy brown interior |
| Interior | Matte charcoal reading surfaces, clear text, restrained borders |
| Contacts | Illustrated portraits, readable presence and status, visible selected row |
| Profile | Straight rectangular fox frame; no arch; adjacent status, labeled service icons and signal meter |
| Conversation | Portrait header, illustrated tabs, time/author/body columns on desktop |
| Composer | Message field, emoji and Send share one compact row; status line below |
| Environment | Quiet original broadcast rooftop plate, tower on right, warm reflections |
| Alternate themes | Daytime covers all panels; High contrast uses flat black/white/yellow surfaces |

Workflow: create artwork, implement desktop, render browser screenshots, compare against the concept, correct visible differences, review alternate themes and phone/tablet views, then publish. `pages.yml` supports `review_only: true` on a review branch and skips Pages publication. Screenshot review happens before the implementation is advanced to the publishing branch.

The artwork consists of a generated background and four equal-width generated contact tiles addressed with CSS background position. Original hand-authored service SVGs are separate. These are assets surrounding working HTML controls, not a flattened interface picture. The existing nine-tailed DSI mascot is retained rather than changing the brand into the concept's humanoid fox portrait. Group headings retain useful Contacts/Stations organization, and decorative operating-system window controls are omitted because the website cannot perform their implied actions.

Browser interaction tests and selected contrast ratios are necessary but do not certify visual fidelity or comprehensive accessibility. Review `concept-desktop.png`, `desktop-default.png`, three theme captures and mobile captures from the workflow artifact. Simulated signal animation is decorative; contacts and presence are fictional and messages remain in tab memory.

Additional UI surfaces follow the same frame, theme tokens and modal focus rules. Review archive, contact-card, profile and emoji-picker screenshots in Dark/Daytime/High contrast, plus 390/768 modal bounds. Review desktop-844.png to verify the composer remains on screen on an ordinary-height display. The portrait sheet uses proportional background sizing to avoid stretching faces. Profile persistence is local; archive persistence and network/account setup remain separate work.

Amber-glass refinement replaces the title-bar gradient with an original generated material texture and a restrained CSS readability shade. The conversation Appearance shortcut is removed; Preferences remains accessible above the windows and from the profile footer. History and Contact card remain adjacent in the conversation toolbar.
