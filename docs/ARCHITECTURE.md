# Architecture

A platform-independent FeatureRuntime owns enabled feature cleanup and failure reporting. Features declare an id, label and start function returning a cleanup function. Reconciliation is synchronous and supports reversible browser display changes.

The Chromium adapter uses a statically declared isolated-world content script on https://discord.com/channels/* only. It installs style elements; it does not hook Discord's private JavaScript runtime. The extension popup writes a single namespaced local settings record. The content adapter listens for changes and reconciles enabled features. Safe mode runs no features.

The build concatenates the original plain-JavaScript modules into one content script and copies the popup and manifest. There is no package dependency, remote code, telemetry or upstream updater.

Mobile and desktop adapters are not implemented. A shared lifecycle does not make DOM features executable in Android.

The GitHub Pages preview reuses the actual feature runtime and CSS against sample messages. Preview settings use a separate browser localStorage record. Pages hosts a ZIP built from the same original extension sources; no GitHub login is needed to download it. The deployment workflow builds and verifies before publishing.
