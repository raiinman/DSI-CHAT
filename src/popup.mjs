const featureContainer = document.getElementById("features");
const safeMode = document.getElementById("safe-mode");
const status = document.getElementById("status");
const controls = new Map();
let settings = normalizeSettings();
let loaded = false;
let saving = false;
for (const feature of FEATURES) {
    const row = document.createElement("div");
    row.className = "feature";
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    label.append(input, document.createTextNode(feature.label));
    const description = document.createElement("p");
    description.className = "description";
    description.textContent = feature.description;
    row.append(label, description);
    featureContainer.append(row);
    controls.set(feature.id, input);
    input.addEventListener("change", () => save());
}
function render() {
    safeMode.checked = settings.safeMode;
    safeMode.disabled = !loaded || saving;
    featureContainer.disabled = !loaded || saving || settings.safeMode;
    for (const [id, input] of controls) input.checked = settings.enabled[id];
}
async function save() {
    const next = normalizeSettings({
        safeMode: safeMode.checked,
        enabled: Object.fromEntries([...controls].map(([id, input]) => [id, input.checked]))
    });
    saving = true;
    render();
    try {
        await chrome.storage.local.set({ [SETTINGS_KEY]: next });
        settings = next;
        status.textContent = settings.safeMode ? "Safe mode active." : "Settings saved.";
    } catch {
        status.textContent = "Could not save. Your previous settings remain.";
    } finally { saving = false; render(); }
}
safeMode.addEventListener("change", () => save());
chrome.storage.local.get(SETTINGS_KEY).then(record => {
    settings = normalizeSettings(record[SETTINGS_KEY]);
    loaded = true;
    render();
    status.textContent = settings.safeMode ? "Safe mode active." : "Ready. Features start disabled.";
}).catch(() => { status.textContent = "Could not load settings. Reopen DSI CHAT."; });
