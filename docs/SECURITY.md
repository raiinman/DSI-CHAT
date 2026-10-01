# Imported translation key alert

GitHub secret-scanning alert 1 identifies a Google API key in the imported desktop translation plugin at revision 22c9ad1f. Its reported validity is unknown. No ownership of that key has been established.

The current fork removes the embedded key and disables Google translation with an explicit error. The DeepL implementation is retained. The original DSI browser prototype on codex/dsi-original does not include this plugin or key.

Removing a key from current source does not remove it from Git history or revoke it. The key owner must review restrictions, revoke or rotate it where appropriate. The alert remains open; it has not been dismissed as a false positive or marked revoked.

Desktop TypeScript validation passed after removing the implementation. Full build verification is pending GitHub Actions.
