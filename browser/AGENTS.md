# Chromium package presentation

## Purpose
Own the extension manifest and popup HTML/CSS.

## Ownership
manifest.json, popup.html and popup.css; JavaScript behavior belongs to ../src/AGENTS.md.

## Local Contracts
- Manifest V3, storage permission and isolated content script matching https://discord.com/channels/*.
- Keep permission scope explicit and feature choices disabled by default.
- Loading/saving failures must not suggest settings were applied successfully.
- Browser package does not implement the messenger shell, Android or a desktop installer.
- The text-size input saves schema-validated local plugin values. Inspect reads DSI runtime metadata from the active channel tab through extension messaging; keep permissions unchanged. A tab query parameter is the documented controlled-popup test route.

## Work Guidance
Keep popup controls accessible, labeled and keyboard usable; coordinate IDs with src/plugins/popup-entry.mjs. Preserve permission and provenance checks when editing the manifest.

## Verification
npm test checks manifest scope and adapter behavior. npm run build copies these files and syntax-checks bundled JavaScript; verify dist/chromium/SHA256SUMS through the existing workflow.

## Child DOX Index
None.
