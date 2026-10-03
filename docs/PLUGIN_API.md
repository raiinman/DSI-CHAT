# Original DSI plugin API 1

Use reviewed original modules with `manifest` and `start(context)`. TypeScript authoring types are in src/plugins/api.d.ts; copy them into a selected project as dsi-api.d.ts. Types help authoring; runtime manifest/capability validation still decides whether a plugin can start. Native Android handlers are Java implementations and do not execute these JavaScript modules.

```typescript
import type {DSIPlugin} from './dsi-api';

const plugin: DSIPlugin = {
  manifest: {
    id: 'my-readable-code', name: 'My readable code', version: '1.0.0',
    apiVersion: 1, platforms: ['browser', 'windows'], capabilities: ['styles'],
    dependencies: [], conflicts: [], settings: {}
  },
  start({scope}) {
    scope.style(document, 'my-readable-code', 'pre { line-height: 1.7 !important; }');
  }
};
export default plugin;
```

The workbench also requires a manifest.json matching the module's normalized manifest. It builds plugin.ts into .dsi-build/plugin.mjs. Preview validates that match and runs only after an explicit action in a separate controlled renderer. Export produces an unreviewed checksummed development package; it does not install into Discord.

Manifests declare API1, ID/version, supported platforms, required capabilities, dependencies/conflicts and primitive setting schemas. Defaults are repaired when values are invalid; settings are immutable in context. Plugins are disabled until chosen. Unsupported requirements report a reason. Dependencies start first; cleanup runs in reverse order. Settings changes restart affected dependents. Start and asynchronous cleanup have bounded deadlines; cancelled starts cannot own new resources. A stalled cleanup can still continue outside the deadline, so code must honor the abort signal. Synchronous JavaScript cannot be interrupted by a promise deadline; Windows Stop destroys an unresponsive controlled preview after its graceful deadline.

Use scope.style, scope.listen, scope.timer and scope.own for reversible resources. Restore only mutations still owned by the plugin. Start may return cleanup or register it in scope. Exceptions are contained and diagnostics bounded. Scope/services declarations are lifecycle contracts, not an arbitrary-code security sandbox; do not run unreviewed plugins in a live client automatically.

The twelve built-ins are the reviewed distribution. Third-party Vencord/Equicord/Vendetta packages are not compatible imports. Browser metadata inspection reads only DSI status. Behavior specifications and platform evidence are in PLUGIN_BEHAVIORS.md and STATE.md.
