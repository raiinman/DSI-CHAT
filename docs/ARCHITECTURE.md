# Architecture

A platform-independent FeatureRuntime owns enabled feature cleanup and failure reporting. Features declare an id, label and start function returning a cleanup function. Reconciliation is synchronous and supports reversible browser display changes.

The Chromium adapter uses a statically declared isolated-world content script on https://discord.com/channels/* only. It installs style elements; it does not hook Discord's private JavaScript runtime. The extension popup writes a single namespaced local settings record. The content adapter listens for changes and reconciles enabled features. Safe mode runs no features.

The build concatenates the original plain-JavaScript modules into one content script and copies the popup and manifest. There is no package dependency, remote code, telemetry or upstream updater.

Mobile and desktop adapters are not implemented. A shared lifecycle does not make DOM features executable in Android.

The GitHub Pages preview reuses the actual feature runtime and CSS against sample messages. Preview settings use a separate browser localStorage record. Pages hosts a ZIP built from the same original extension sources; no GitHub login is needed to download it. The deployment workflow builds and verifies before publishing.

The messenger preview keeps contact data and per-conversation histories in a small original model. Messages stay in tab memory, and rendering uses textContent for message bodies. No network adapter is connected. The Trillian-inspired layout belongs to the preview; applying that shell to Discord remains separate platform work.

The preview's theme selector is independent of feature lifecycle. Its complete CSS themes cover the entire messenger and preferences. It shares Compact messages and Reduced motion with the extension, but does not install Discord's Signal CSS, which would override light surfaces. The preview settings record stores a validated theme alongside normalized feature settings; older Signal selections migrate to High contrast. Discord/Relay/Local buttons display preview-only connection status and make no network requests.
