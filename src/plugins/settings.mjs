import { normalizePluginValues } from "./runtime.mjs";
export const PLUGIN_SETTINGS_KEY = "dsiChat.plugins.settings.v2";
export const LEGACY_SETTINGS_KEY = "dsiChat.original.settings.v1";
export function normalizePluginSettings(value, manifests) {
    const source = value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
    const enabled = source.enabled !== null && typeof source.enabled === "object" && !Array.isArray(source.enabled) ? source.enabled : {};
    const values = source.plugins !== null && typeof source.plugins === "object" && !Array.isArray(source.plugins) ? source.plugins : {};
    return { version: 2, safeMode: source.safeMode === true,
        enabled: Object.fromEntries(manifests.map(manifest => [manifest.id, Object.hasOwn(enabled, manifest.id) && enabled[manifest.id] === true])),
        plugins: Object.fromEntries(manifests.map(manifest => [manifest.id, normalizePluginValues(manifest, values[manifest.id])])) };
}
export function migratePluginSettings(record, manifests) {
    const current = record?.[PLUGIN_SETTINGS_KEY];
    const currentValid = current !== null && typeof current === "object" && !Array.isArray(current) && current.version === 2;
    return { settings: normalizePluginSettings(currentValid ? current : record?.[LEGACY_SETTINGS_KEY], manifests), migrated: !currentValid };
}
