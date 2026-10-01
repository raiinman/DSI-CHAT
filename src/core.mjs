export const FEATURES = [
    { id: "signal-theme", label: "Signal theme", description: "Charcoal surfaces with orange highlights." },
    { id: "compact-messages", label: "Compact messages", description: "Reduce vertical message spacing." },
    { id: "reduced-motion", label: "Reduced motion", description: "Suppress animations and transitions." }
];
export const SETTINGS_KEY = "dsiChat.original.settings.v1";

export function normalizeSettings(value) {
    const input = value && typeof value === "object" ? value : {};
    const enabled = input.enabled && typeof input.enabled === "object" ? input.enabled : {};
    return {
        version: 1,
        safeMode: input.safeMode === true,
        enabled: Object.fromEntries(FEATURES.map(feature => [feature.id, enabled[feature.id] === true]))
    };
}

export class FeatureRuntime {
    #features;
    #active = new Map();
    constructor(features) {
        this.#features = new Map();
        for (const feature of features) {
            if (this.#features.has(feature.id)) throw new Error("Duplicate feature: " + feature.id);
            this.#features.set(feature.id, feature);
        }
    }
    reconcile(settings) {
        const state = normalizeSettings(settings);
        const errors = [];
        for (const [id, cleanup] of this.#active) {
            if (state.safeMode || !state.enabled[id]) {
                try { cleanup(); } catch (error) { errors.push({ id, phase: "stop", error }); }
                this.#active.delete(id);
            }
        }
        for (const [id, feature] of this.#features) {
            if (!state.safeMode && state.enabled[id] && !this.#active.has(id)) {
                try {
                    const cleanup = feature.start();
                    if (typeof cleanup !== "function") throw new Error("Feature must return cleanup");
                    this.#active.set(id, cleanup);
                } catch (error) { errors.push({ id, phase: "start", error }); }
            }
        }
        return { active: [...this.#active.keys()], errors };
    }
    dispose() { return this.reconcile({ safeMode: true }); }
}
