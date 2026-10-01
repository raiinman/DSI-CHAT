import { FEATURES, FeatureRuntime, normalizeSettings } from "./src/core.mjs";
import { browserFeatures } from "./src/features.mjs";
const key = "dsiChat.site.preview.v1";
const runtime = new FeatureRuntime(browserFeatures(document));
const safe = document.getElementById("safe-mode");
const group = document.getElementById("features");
const status = document.getElementById("status");
let settings = normalizeSettings();
let persistent = true;
try { settings = normalizeSettings(JSON.parse(localStorage.getItem(key))); }
catch { persistent = false; }
function render() {
    safe.checked = settings.safeMode;
    group.disabled = settings.safeMode;
    for (const feature of FEATURES) document.getElementById(feature.id).checked = settings.enabled[feature.id];
    const result = runtime.reconcile(settings);
    if (result.errors.length) status.textContent = "A display feature could not start. Try safe mode.";
    else status.textContent = settings.safeMode ? "Safe mode active. Your choices are saved."
        : result.active.length ? result.active.length + " features active in this preview." : "Features start disabled.";
    if (!persistent) status.textContent += " Changes apply for this visit.";
}
function save() {
    try { localStorage.setItem(key, JSON.stringify(settings)); persistent = true; }
    catch { persistent = false; }
    render();
}
safe.addEventListener("change", () => { settings.safeMode = safe.checked; save(); });
for (const feature of FEATURES) document.getElementById(feature.id).addEventListener("change", event => {
    settings.enabled[feature.id] = event.target.checked;
    save();
});
document.getElementById("reset").addEventListener("click", () => { settings = normalizeSettings(); save(); });
render();
