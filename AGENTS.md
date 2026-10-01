# DSI CHAT

Read README.md, docs/ARCHITECTURE.md, docs/STATE.md, and upstream.lock.json before changes.

GitHub is the durable source of truth. Preserve the original Vendetta code in legacy/vendetta.
Mobile uses Revenge's Metro / React Native runtime. Desktop and web use Equicord's Vencord-derived Webpack runtime.
Do not promise cross-runtime plugin compatibility. Port features individually and record platform support.
Preserve all upstream copyright, license, author and plugin provenance information.
Keep Vencord, VencordNative, bunny, vendetta, loader keys and storage identifiers compatible.
Do not connect DSI builds to upstream binary update channels. External services must remain identified as upstream services.
Run npm test, generate the catalog, build changed targets, and record real validation in docs/STATE.md.
Never claim an APK, installed desktop client, live Discord test or device validation from a bundle build alone.
Do not access credentials, export sessions, send Discord messages, or enable plugins in the user's live account without a specific instruction.
