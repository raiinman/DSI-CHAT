const runtime = new FeatureRuntime(browserFeatures(document));
let revision = 0;
function apply(value) {
    const result = runtime.reconcile(value);
    for (const failure of result.errors) console.warn("[DSI CHAT]", failure.id, failure.phase, failure.error);
}
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && Object.hasOwn(changes, SETTINGS_KEY)) {
        revision++;
        apply(changes[SETTINGS_KEY].newValue);
    }
});
const initialRevision = revision;
chrome.storage.local.get(SETTINGS_KEY).then(record => {
    if (revision === initialRevision) apply(record[SETTINGS_KEY]);
}).catch(error => console.warn("[DSI CHAT] Settings unavailable", error));
window.addEventListener("pagehide", () => runtime.dispose());
window.addEventListener("pageshow", event => {
    if (event.persisted) {
        const requestRevision = revision;
        chrome.storage.local.get(SETTINGS_KEY).then(record => {
            if (revision === requestRevision) apply(record[SETTINGS_KEY]);
        }).catch(error => console.warn("[DSI CHAT] Settings unavailable", error));
    }
});
