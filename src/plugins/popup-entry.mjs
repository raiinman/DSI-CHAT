import { BUILTIN_MANIFESTS } from "./builtins.mjs";
import { migratePluginSettings, normalizePluginSettings, PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY } from "./settings.mjs";
const container = document.getElementById("features");
const safe = document.getElementById("safe-mode");
const status = document.getElementById("status");
const filter = document.getElementById("plugin-filter");
const inspect = document.getElementById("inspect-runtime");
const controls = new Map(), rows = new Map(), settingControls = new Map();
let settings = normalizePluginSettings({}, BUILTIN_MANIFESTS), loaded = false, saving = false;
for (const manifest of BUILTIN_MANIFESTS) {
    const row = document.createElement("div"); row.className = "feature";
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = "checkbox"; input.dataset.plugin = manifest.id;
    label.append(input, document.createTextNode(manifest.name));
    const description = document.createElement("p"); description.className = "description"; description.textContent = manifest.description;
    row.append(label, description); container.append(row); controls.set(manifest.id, input); rows.set(manifest.id, row);
    input.addEventListener("change", save);
    for (const [key, schema] of Object.entries(manifest.settings)) {
        const label=document.createElement("label"); label.className="plugin-setting";
        label.append(document.createTextNode(schema.label || key));
        const field=document.createElement("input"); field.type="number";
        field.min=schema.min; field.max=schema.max; field.step=schema.step || "any"; field.required=true;
        field.dataset.setting=manifest.id+"."+key;
        label.append(field); row.append(label);
        settingControls.set(manifest.id+"."+key,{id:manifest.id,key,field}); field.addEventListener("change",save);
    }
}
function render() {
    safe.checked = settings.safeMode; safe.disabled = !loaded || saving;
    container.disabled = !loaded || saving || settings.safeMode;
    inspect.disabled = !loaded || saving;
    for (const [id, input] of controls) input.checked = settings.enabled[id];
    for (const {id,key,field} of settingControls.values()) field.value=settings.plugins[id][key];
}
async function save() {
    if (!loaded || saving) return;
    const values=structuredClone(settings.plugins);
    if (!safe.checked) for (const {id,key,field} of settingControls.values()) {
        if (!field.checkValidity()) { status.textContent="Enter a text size from 14 to 28 pixels."; field.reportValidity(); return; }
        values[id][key]=Number(field.value);
    }
    const next = normalizePluginSettings({ ...settings, safeMode: safe.checked,
        plugins:values,
        enabled: Object.fromEntries([...controls].map(([id, input]) => [id, input.checked])) }, BUILTIN_MANIFESTS);
    saving = true; render();
    try {
        await chrome.storage.local.set({ [PLUGIN_SETTINGS_KEY]: next });
        settings = next;
        status.textContent = settings.safeMode ? "Safe mode saved. Plugin choices are retained." : "Plugin settings saved.";
    } catch { status.textContent = "Could not save. Your previous settings remain."; }
    finally { saving = false; render(); }
}
safe.addEventListener("change", save);
filter.addEventListener("input", () => {
    const query = filter.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const manifest of BUILTIN_MANIFESTS) {
        const matches = (manifest.name + " " + manifest.description).toLocaleLowerCase().includes(query);
        rows.get(manifest.id).hidden = !matches;
        if (matches) visible++;
    }
    document.getElementById("filter-result").textContent = visible ? `${visible} original plugins` : "No matching plugins. Clear search to show all.";
});
chrome.storage.local.get([PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY]).then(record => {
    settings = migratePluginSettings(record, BUILTIN_MANIFESTS).settings;
    loaded = true; render();
    status.textContent = settings.safeMode ? "Safe mode active." : "Ready. Plugins are disabled until you choose them.";
}).catch(() => { status.textContent = "Could not load settings. Reopen DSI CHAT."; });
inspect.addEventListener("click",async()=>{
    inspect.disabled=true;
    try {
        // Chrome's documented popup E2E pattern can select a fixture tab explicitly.
        const selected=new URLSearchParams(location.search).get("tab");
        const tab=selected && /^\d+$/.test(selected) && Number.isSafeInteger(Number(selected))
            ? await chrome.tabs.get(Number(selected)) : (await chrome.tabs.query({active:true,currentWindow:true}))[0];
        if (!Number.isInteger(tab?.id)) throw new Error("No selected tab");
        const report=await chrome.tabs.sendMessage(tab.id,{kind:"dsi:plugin-status"});
        if(report?.kind!=="dsi-plugin-status")throw new Error("Unsupported response");
        document.getElementById("runtime-report").textContent=JSON.stringify(report,null,2);
        document.getElementById("runtime-details").open=true;
    } catch {
        document.getElementById("runtime-report").textContent="No DSI runtime answered. Open a Discord channel tab, then inspect again.";
        document.getElementById("runtime-details").open=true;
    } finally {inspect.disabled=!loaded || saving;}
});
