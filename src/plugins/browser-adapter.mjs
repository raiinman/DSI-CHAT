import { BUILTIN_MANIFESTS } from "./builtins.mjs";
import { migratePluginSettings, normalizePluginSettings, PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY } from "./settings.mjs";
export function attachBrowserRuntime({ storage, window, runtime, warn = () => {} }) {
    let revision = 0, alive = true, suspended = false;
    let settings = normalizePluginSettings({}, BUILTIN_MANIFESTS);
    const apply = async () => {
        if (!alive || suspended) return;
        const result = await runtime.reconcile(settings);
        for (const error of result.errors) warn(error.id, error.phase, error.message);
        for (const blocked of result.blocked) warn(blocked.id, "blocked", blocked.reason);
        return result;
    };
    const refresh = async () => {
        const request = revision;
        try {
            const record = await storage.local.get([PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY]);
            if (!alive || suspended || revision !== request) return;
            const loaded = migratePluginSettings(record, BUILTIN_MANIFESTS);
            settings = loaded.settings;
            await apply();
            if (loaded.migrated && alive && !suspended && revision === request) {
                try { await storage.local.set({ [PLUGIN_SETTINGS_KEY]: settings }); }
                catch (error) { warn("settings", "migration", error.message); }
            }
        } catch (error) { warn("settings", "load", error.message); }
    };
    const changed = (changes, area) => {
        if (!alive || area !== "local" || !Object.hasOwn(changes, PLUGIN_SETTINGS_KEY)) return;
        revision++;
        settings = normalizePluginSettings(changes[PLUGIN_SETTINGS_KEY].newValue, BUILTIN_MANIFESTS);
        apply().catch(error => warn("runtime", "reconcile", error.message));
    };
    const dispose = async () => {
        if (!alive) return;
        alive = false; revision++;
        storage.onChanged.removeListener(changed);
        window.removeEventListener("pagehide", hide);
        window.removeEventListener("pageshow", show);
        return runtime.dispose();
    };
    const hide = event => {
        suspended = true; revision++;
        if (event.persisted) runtime.reconcile({ safeMode: true }).catch(error => warn("runtime", "suspend", error.message));
        else dispose().catch(error => warn("runtime", "dispose", error.message));
    };
    const show = event => {
        if (!event.persisted || !alive) return;
        suspended = false;
        refresh().catch(error => warn("runtime", "resume", error.message));
    };
    storage.onChanged.addListener(changed);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    return { ready: refresh(), dispose, refresh, getSettings: () => structuredClone(settings) };
}
