# Design references and reviewed captures

## Purpose
Retain the approved visual specification and evidence of rendered implementation review.

## Ownership
copperlight-concept.png is the approved current reference. copperlight-desktop.png, copperlight-phone.png and copperlight-night.png document the current implementation. Orange-glass concepts and older captures remain historical evidence.

plugin-runtime.png and plugin-settings.png show the actual controlled Chromium extension; windows-host.png, workbench-editor.png and workbench-diagnostics.png show the tested portable Electron tools. These are separate development surfaces, not a redesign of the locked messenger or proof of live-account compatibility.

android-native-settings.png records the original patched configuration-split fixture's restored native controls on the API35 emulator. It does not show Discord attachment.

workbench-redteam.png shows the rendered controlled adversarial preview after file/network restrictions; its sentinel and network assertions are recorded in SECURITY_REVIEW.md/STATE.md.
windows-live-host.png records the packaged dashboard's host state and reload/retry controls. discord-host-fixture.png records intercepted official-origin integration QA; neither contains a live account or proves full feature parity. Private live acceptance captures stay outside the repository.

manager-default.png, manager-installed.png, manager-update.png, manager-update-restored.png and manager-large-font.png record the separate original phone-only Manager and native updater. They are controlled Android sample/QA evidence, not Discord screens.
manager-update-failure-restored.png records the fixed HTTP503/restart regression: a failed check remains visible after relaunch.

## Local Contracts
The generated concept is a reference, not shipped UI. The user explicitly replaced orange glass with Copperlight Realism. Keep real controls, existing identities and honest local-preview behavior; omit concept-only calls/media/window controls until functional.

## Work Guidance
Retain representative reviewed captures for meaningful UI changes and update handoff references. Keep generated backgrounds/portraits/materials intended for shipping in site/assets/. Do not mistake a screenshot for functional implementation.

## Verification
Inspect desktop 1440x844, Dark/Daytime/High contrast, 390/768 and changed states before publication, using the existing review-only screenshot workflow in ../VISUAL_WORKFLOW.md.

For Manager changes, inspect manager.yml API35 emulator captures including first launch, source permission, native install/update approval, errors, installed/recovered state and large-font wrapping. Retain representative captures from the final passed run. Preserve the messenger baseline.

## Child DOX Index
None.
