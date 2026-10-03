# Original plugin acceptance

API 1 built-ins are reviewed local DSI code. Browser and Windows share definitions; Android implements native handlers separately. All choices default off. This batch changes visible presentation only and makes no network requests or server/account mutations.

| Plugin | Original behavior | Acceptance fixture |
| --- | --- | --- |
| Signal theme | Charcoal surfaces, light text and orange links | Rendered colors remain readable; removing owned style restores baseline |
| Compact messages | Reduce vertical padding on visible message rows | Scoped stylesheet attaches once, removes on stop |
| Reduced motion | Suppress CSS animation, transitions and smooth scroll | Safe mode removes override; saved choice survives |
| Keyboard focus | Clear orange keyboard focus outline | Focused real button has 3px outline |
| Readable code | Wrapped code lines with monospace spacing | Computed pre wrapping changes, then restores |
| Larger text | Validated 14–28px visible message content, default18px | Choose22px through real control; invalid99px is rejected; config survives safe mode/reload |
| Clear links | Underline visible message links | Computed decoration changes, then restores |
| Fit media | Bound visible images/video to conversation width/height | Image max-width computed as 100% |
| Hide typing | Hide rendered typing indicator locally | Fixture indicator disappears and returns in safe mode |
| Wider scrollbars | Wider pointer targets where Chromium styles support them | Owned style lifecycle; OS/browser scrollbar presentation varies |
| Full timestamps | Local full-date/time tooltips on valid datetime elements | Tooltip replaces/restores original; invalid dates stay unchanged |
| Link destinations | Actual HTTP(S) destination tooltip on visible links | URL changes update; non-web URLs and detached nodes release ownership |

Real Chromium extension QA uses the production content-script URL pattern, intercepts all HTTPS traffic and supplies local fixture markup. It verifies actual chrome.storage settings, twelve controls, search/empty states, safe-mode cleanup/retention and reload. This establishes DSI behavior against the fixture; current live Discord selectors need separate acceptance. Windows source/packaged smoke proves the same engine attaches to its controlled renderer.

The explicit Inspect control requests a bounded DSI runtime report from the active Discord channel tab. It shows actual active IDs, capability gates and diagnostics, and reports when no DSI content script answers. It does not read message content, imply server connectivity or require extra permissions. The controlled popup test selects its fixture tab through Chrome's documented query-parameter pattern.

Native Android has three original counterparts: enlarge TextView text by 15%, reduce extra line spacing, and suppress Activity window animation styles. Native lifecycle assertions cover registration, dependencies/conflicts, capabilities, rollback, cleanup and safe mode. The bootstrap patch fixture preserves its original Application and receives a separate DSI DEX. Emulator QA verifies settings persistence and actual native controls. None of this establishes Discord React Native private-module access.

Reference directory identifiers in REFERENCE_INVENTORY.json are an untriaged future backlog, not delivered plugins. Future behavior specifications must state host access and cleanup/acceptance before claiming support. Do not derive implementation by copying upstream modules.
