import { PluginRuntime } from "./runtime.mjs";
import { createBuiltinPlugins } from "./builtins.mjs";
import { attachBrowserRuntime } from "./browser-adapter.mjs";
const runtime = new PluginRuntime({ platform: "browser", capabilities: ["styles", "dom", "events"], plugins: createBuiltinPlugins(document) });
attachBrowserRuntime({ storage: chrome.storage, window, runtime, warn: (...details) => console.warn("[DSI CHAT]", ...details) });
