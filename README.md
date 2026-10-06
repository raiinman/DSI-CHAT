<!-- project-centered:start -->
<div align="center">

<a name="readme-top"></a>
<h1 align="center">DSI CHAT</h1>

<!-- project-header:start -->
<p align="center"><img src="readme-banner.png" alt="DSI-CHAT — original generated project artwork" width="100%"></p>
<!-- project-header:end -->

<!-- project-badges:start -->
<p align="center"><a href="https://github.com/raiinman/DSI-CHAT"><img src="https://img.shields.io/badge/DSI-CHAT-7C3AED?labelColor=333333&amp;logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI%2BPHBhdGggZD0iTTEgMmgxNHYxMEg2bC00IDN2LTNIMVYyeiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNCA2aDJ2Mkg0em0zIDBoMnYySDd6bTMgMGgydjJoLTJ6IiBmaWxsPSIjMzMzIi8%2BPC9zdmc%2B&amp;logoColor=white" alt="DSI: CHAT"></a> <a href="https://github.com/raiinman/DSI-CHAT"><img src="https://img.shields.io/badge/targets-Android_%C2%B7_desktop_%C2%B7_web-0891B2?labelColor=333333&amp;logo=android&amp;logoColor=white" alt="targets: Android · desktop · web"></a> <a href="https://github.com/raiinman/DSI-CHAT/blob/rewrite/docs/INSTALLATION.md"><img src="https://img.shields.io/badge/docs-installation-475569?labelColor=333333&amp;logo=readthedocs&amp;logoColor=white" alt="docs: installation"></a></p>
<!-- project-badges:end -->

<!-- project-live-badges:start -->
<p align="center"><a href="https://github.com/raiinman/DSI-CHAT/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/raiinman/DSI-CHAT/build.yml?branch=rewrite&amp;labelColor=333333&amp;logo=githubactions&amp;logoColor=white&amp;label=build" alt="build"></a> <a href="https://github.com/raiinman/DSI-CHAT/commits/rewrite"><img src="https://img.shields.io/github/last-commit/raiinman/DSI-CHAT/rewrite?labelColor=333333&amp;color=7C3AED&amp;logo=github&amp;logoColor=white&amp;label=updated" alt="last commit"></a> <a href="https://github.com/raiinman/DSI-CHAT/issues"><img src="https://img.shields.io/github/issues/raiinman/DSI-CHAT?labelColor=333333&amp;color=7C3AED&amp;logo=github&amp;logoColor=white&amp;label=issues" alt="open issues"></a> <a href="https://github.com/raiinman/DSI-CHAT/stargazers"><img src="https://badgen.net/github/stars/raiinman/DSI-CHAT?icon=github&amp;color=7C3AED&amp;labelColor=333333&amp;label=stars" alt="stars"></a></p>
<!-- project-live-badges:end -->

<!-- project-index:start -->
<a name="readme-index"></a>
<h3 align="center">✦ Explore this project</h3>

<table align="center"><tbody><tr><td align="center"><a href="#readme-overview"><strong>Overview</strong></a></td><td align="center"><a href="#readme-build"><strong>Build</strong></a></td></tr><tr><td align="center" colspan="2"><a href="#readme-what-is-ours"><strong>What is ours</strong></a></td></tr></tbody></table>

<h4 align="center">Project shortcuts</h4>

<table align="center"><tbody><tr><td align="center"><a href="docs/INSTALLATION.md"><strong>Installation</strong></a></td><td align="center"><a href="docs/ARCHITECTURE.md"><strong>Architecture</strong></a></td></tr><tr><td align="center"><a href="docs/STATE.md"><strong>Validation</strong></a></td><td align="center"><a href="THIRD_PARTY_NOTICES.md"><strong>Credits &amp; licenses</strong></a></td></tr></tbody></table>
<!-- project-index:end -->

<a name="readme-overview"></a>
<h2 align="center">Overview</h2>

Dead Signal Interactive's Discord customization suite for **Android, desktop, and browsers**.

DSI CHAT integrates Revenge's Android engine and Equicord's desktop/browser engine. Equicord already includes Vencord's framework and plugin collection. They share a product identity, not a JavaScript runtime.

<table align="center"><thead><tr><th align="center">Target</th><th align="center">Engine</th><th align="center">Included functionality</th><th align="center">Output</th></tr></thead><tbody><tr><td align="center">Android</td><td align="center">Revenge / Bunny / Vendetta lineage</td><td align="center">Plugin management, themes, fonts, experiments, recovery, legacy Vendetta compatibility, DSI Clean Links</td><td align="center">JavaScript bundle for a compatible loader</td></tr><tr><td align="center">Desktop</td><td align="center">Equicord / Vencord</td><td align="center">Both upstream plugin collections, themes, QuickCSS, settings backup, diagnostics</td><td align="center">Standalone injector bundles</td></tr><tr><td align="center">Browser</td><td align="center">Equicord / Vencord</td><td align="center">Plugins supported by the web build, themes, QuickCSS, backup</td><td align="center">Chromium/Firefox extensions and userscript</td></tr></tbody></table>


<p align="center"><a href="#readme-index">↑ Back to index</a></p>

<a name="readme-build"></a>
## Build


Use Node.js 24 or newer. Package manager version is pinned in package.json.

<table align="center"><tbody><tr><td align="left"><pre><code>npm install
npm run setup
npm test
npm run catalog
npm run build
npm run verify</code></pre></td></tr></tbody></table>


Individual targets: `npm run build:mobile`, `npm run build:desktop`, `npm run build:web`.
Built files and checksums are collected in `release/`. See [installation](docs/INSTALLATION.md) and [current validation](docs/STATE.md).

The first [verified build](https://github.com/raiinman/DSI-CHAT/actions/runs/36826169778) contains a downloadable `dsi-chat-builds` artifact with all three targets.

<p align="center"><a href="#readme-index">↑ Back to index</a></p>

<a name="readme-what-is-ours"></a>
## What is ours


DSI owns this fork's branding, integration, build orchestration, feature catalog, and original additions. Upstream authors retain credit for their code. Public APIs and storage keys retain their existing names for plugin and loader compatibility.

Android plugins cannot directly execute desktop Webpack/DOM plugins. A feature port must be implemented and tested against the Android client. Desktop account switching support does not imply an Android account switcher.

Upstream binary updates are disabled in desktop/web builds. DSI does not operate a cloud backend, app-store listing, Android APK manager, or installer yet. Optional upstream cloud and plugin services retain their upstream names.

The original fork is preserved in [legacy/vendetta](legacy/vendetta). Imported revisions are recorded in [upstream.lock.json](upstream.lock.json).

See [architecture](docs/ARCHITECTURE.md), [feature catalog](catalog/features.json), and [credits and licenses](THIRD_PARTY_NOTICES.md).

<p align="center"><a href="#readme-index">↑ Back to index</a> · <a href="#readme-top">Back to top ↑</a></p>

</div>
<!-- project-centered:end -->
