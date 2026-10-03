import { BUILTIN_MANIFESTS } from "./builtins.mjs";
import { migratePluginSettings, normalizePluginSettings, PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY } from "./settings.mjs";
const container = document.getElementById("features");
const safe = document.getElementById("safe-mode");
const status = document.getElementById("status");
const filter = document.getElementById("plugin-filter");
const controls = new Map(), rows = new Map();
let settings = normalizePluginSettings({}, BUILTIN_MANIFESTS), loaded = false, saving = false;
for (const manifest of BUILTIN_MANIFESTS) {
    const row = document.createElement("div"); row.className = "feature";
    const label = document.createElement("label"), input = document.createElement("input");
    input.type = "checkbox"; input.dataset.plugin = manifest.id;
    label.append(input, document.createTextNode(manifest.name));
    const description = document.createElement("p"); description.className = "description"; description.textContent = manifest.description;
    row.append(label, description); container.append(row); controls.set(manifest.id, input); rows.set(manifest.id, row);
    input.addEventListener("change", save);
}
function render() {
    safe.checked = settings.safeMode; safe.disabled = !loaded || saving;
    container.disabled = !loaded || saving || settings.safeMode;
    for (const [id, input] of controls) input.checked = settings.enabled[id];
}
async function save() {
    if (!loaded || saving) return;
    const next = normalizePluginSettings({ ...settings, safeMode: safe.checked,
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
