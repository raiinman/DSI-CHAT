# Copperlight implementation and acceptance

The user-approved reference is [copperlight-concept.png](design/copperlight-concept.png). This explicitly supersedes orange-glass requirements; older references/captures remain historical evidence.

Review cream plaster surfaces, terracotta trim/send, sage navigation, turquoise controls, subtle texture and gentle physical depth. The layout contains a usable rail, contact list, central chat and selected-contact/station sidebar. Message bubbles stay readable and the composer remains visible. Match the direction while preserving actual contacts/mascot and excluding unimplemented call/media/OS buttons.

Use original generated artwork as a decorative panorama, never a flattened UI. Implement controls in HTML. Night uses cool sage surfaces; Afternoon is default/reset; valid saved themes persist. High contrast has flat surfaces and no valley banner. Review dialog focus, sidebar identity changes, contact groups/favorites, drafts and local export.

Run existing unit/catalog/build/site checks and browser QA. Dispatch pages.yml with review_only=true on a review branch before advancing codex/dsi-original. Download dsi-messenger-screenshots and inspect desktop-844, concept-desktop, three themes, 390/768, composer and changed dialogs. Correct visible defects before publication. Check all four contacts and composer fit 1440x844, no horizontal overflow, native dialog focus return and reduced motion. Passing tests alone does not establish visual acceptance.

After review, advance the publishing branch, verify Pages/extension CI and public file bytes, record actual evidence in STATE.md and retain representative captures here. These checks cover the local preview, not a live account, screen reader or physical phone.
