import { PluginRuntime } from "./runtime.mjs";
import { createBuiltinPlugins } from "./builtins.mjs";
import { attachBrowserRuntime } from "./browser-adapter.mjs";
const runtime = new PluginRuntime({ platform: "browser", capabilities: ["styles", "dom", "events"], plugins: createBuiltinPlugins(document) });
const adapter=attachBrowserRuntime({ storage: chrome.storage, window, runtime, warn: (...details) => console.warn("[DSI CHAT]", ...details) });
function report(message,sender,respond) {
    if (sender.id!==chrome.runtime.id || message?.kind!=="dsi:plugin-status") return;
    adapter.ready.then(()=>respond({kind:"dsi-plugin-status",...runtime.status,safeMode:adapter.getSettings().safeMode}),
        ()=>respond({kind:"dsi-plugin-status",error:"Initial settings could not be applied."}));
    return true;
}
chrome.runtime.onMessage.addListener(report);
window.addEventListener("pagehide",event=>{if(!event.persisted)chrome.runtime.onMessage.removeListener(report);});
