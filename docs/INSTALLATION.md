# Installation and acceptance

## Browser

Build with `npm run build:web`. Chromium output is `release/web/chromium-unpacked`; Firefox output is `release/web/extension-firefox.zip`. The userscript is `release/web/DSI-CHAT.user.js`.

In Chromium, open the extension management page, enable Developer mode, choose Load unpacked and select the output folder. Use only one Discord mod extension in that browser profile. Reload Discord and confirm a DSI CHAT settings section appears.

Confirm the plugin list loads, enable one optional plugin, reload, confirm the preference persists, then disable it. Check the browser console for patch failures. Disable or remove the extension to recover.

## Android

Build with `npm run build:mobile`. Load `release/mobile/dsi-chat.js` through a Revenge-compatible loader's custom bundle URL. The exact loader must support loading a custom bundle and its theme/font features. This repository does not yet produce a branded APK or manager.

The unminified and minified outputs are JavaScript, not Hermes bytecode. Keep an upstream recovery bundle URL available while testing. Confirm startup, DSI CHAT settings, plugin enable/disable, theme selection, restart and safe-mode recovery on the device.

DSI Clean Links is disabled by default. Enable it in Plugins, then verify opening a link removes known tracking query parameters while preserving signed links and functional parameters. It cleans links being opened, not outgoing messages.

## Desktop

Build with `npm run build:desktop`. Outputs under `release/desktop` retain upstream filenames required by compatible injection tooling. This source integration does not include a new installer. Do not run upstream `pnpm inject`: that command downloads an upstream installer rather than installing DSI's packaged build.

Validate with an injector configured for these local artifacts. Check settings, plugin toggles, themes, recovery and native helper functions. Desktop runtime installation remains a separate acceptance step.

## External services

Upstream plugin repositories, translations, badges, theme catalogs and optional cloud services remain external upstream services. DSI does not claim to own or operate them. Automatic binary updating is disabled in DSI desktop/web builds.
