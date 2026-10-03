export const PLUGIN_API_VERSION = 1;
const ID = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
async function cleanupWithin(cleanup, milliseconds) {
    let timeout;
    try {
        return await Promise.race([Promise.resolve().then(cleanup), new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Plugin cleanup timed out")), milliseconds);
        })]);
    } finally { clearTimeout(timeout); }
}
function identifier(value) {
    if (typeof value !== "string" || !ID.test(value) || FORBIDDEN.has(value)) throw new Error("Invalid plugin identifier");
    return value;
}
function identifiers(value, field) {
    if (!Array.isArray(value) || value.length > 64) throw new Error(`Invalid ${field}`);
    return Object.freeze([...new Set(value.map(identifier))]);
}
export function validateManifest(input) {
    if (!object(input)) throw new Error("Plugin manifest must be an object");
    const id = identifier(input.id);
    if (typeof input.version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(input.version)) throw new Error(`Invalid version for ${id}`);
    if (input.apiVersion !== PLUGIN_API_VERSION) throw new Error(`Unsupported plugin API for ${id}`);
    const platforms = identifiers(input.platforms, "platforms");
    if (!platforms.length) throw new Error(`No platform declared for ${id}`);
    const schema = input.settings ?? {};
    if (!object(schema) || Object.keys(schema).length > 64) throw new Error(`Invalid settings schema for ${id}`);
    const settings = {};
    for (const [key, source] of Object.entries(schema)) {
        identifier(key);
        if (!object(source) || !["boolean", "number", "string", "enum"].includes(source.type)) throw new Error(`Invalid setting ${id}.${key}`);
        const item = { ...source };
        if (item.type === "boolean" && typeof item.default !== "boolean") throw new Error(`Invalid default for ${id}.${key}`);
        if (item.type === "string" && (typeof item.default !== "string" || item.default.length > 4096)) throw new Error(`Invalid default for ${id}.${key}`);
        if (item.type === "number") {
            if (!Number.isFinite(item.default) || (item.min !== undefined && !Number.isFinite(item.min)) || (item.max !== undefined && !Number.isFinite(item.max)) || (item.min !== undefined && item.max !== undefined && item.min > item.max)) throw new Error(`Invalid numeric setting ${id}.${key}`);
            if ((item.min !== undefined && item.default < item.min) || (item.max !== undefined && item.default > item.max)) throw new Error(`Invalid default for ${id}.${key}`);
        }
        if (item.type === "enum") {
            if (!Array.isArray(item.values) || !item.values.length || item.values.length > 64 || item.values.some(value => !["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) || !item.values.includes(item.default)) throw new Error(`Invalid enum ${id}.${key}`);
            item.values = Object.freeze([...item.values]);
        }
        settings[key] = Object.freeze(item);
    }
    const dependencies = identifiers(input.dependencies ?? [], "dependencies");
    const conflicts = identifiers(input.conflicts ?? [], "conflicts");
    if (dependencies.includes(id) || conflicts.includes(id)) throw new Error(`Self dependency/conflict for ${id}`);
    return Object.freeze({ id, version: input.version, apiVersion: input.apiVersion,
        name: typeof input.name === "string" ? input.name.slice(0, 120) : id,
        description: typeof input.description === "string" ? input.description.slice(0, 1000) : "",
        platforms, capabilities: identifiers(input.capabilities ?? [], "capabilities"), dependencies, conflicts,
        settings: Object.freeze(settings) });
}
export function normalizePluginValues(manifest, input) {
    const source = object(input) ? input : {};
    return Object.fromEntries(Object.entries(manifest.settings).map(([key, schema]) => {
        const value = Object.hasOwn(source, key) ? source[key] : undefined;
        let valid = schema.type === "enum" ? schema.values.includes(value) : typeof value === schema.type;
        if (schema.type === "number") valid = valid && Number.isFinite(value) && (schema.min === undefined || value >= schema.min) && (schema.max === undefined || value <= schema.max);
        if (schema.type === "string") valid = valid && value.length <= 4096;
        return [key, valid ? value : schema.default];
    }));
}
export class ResourceScope {
    #cleanups = [];
    #known = new Set();
    #closed = false;
    constructor(signal = new AbortController().signal, cleanupTimeout = 5000) {
        if (!Number.isFinite(cleanupTimeout) || cleanupTimeout < 1 || cleanupTimeout > 60000) throw new Error("Invalid cleanup timeout");
        this.signal = signal; this.cleanupTimeout = cleanupTimeout;
    }
    #assertOpen() { if (this.#closed || this.signal.aborted) throw new Error("Plugin scope is closed"); }
    own(cleanup) {
        this.#assertOpen();
        if (typeof cleanup !== "function") throw new Error("Cleanup must be a function");
        if (!this.#known.has(cleanup)) { this.#known.add(cleanup); this.#cleanups.push(cleanup); }
        return cleanup;
    }
    listen(target, type, listener, options) {
        this.#assertOpen();
        target.addEventListener(type, listener, options);
        return this.own(() => target.removeEventListener(type, listener, options));
    }
    style(document, id, css) {
        this.#assertOpen();
        identifier(id);
        const style = document.createElement("style");
        style.dataset.dsiPlugin = id;
        style.dataset.dsiFeature = id;
        style.textContent = css;
        document.head.append(style);
        return this.own(() => style.remove());
    }
    timer(callback, milliseconds) {
        this.#assertOpen();
        if (!Number.isFinite(milliseconds) || milliseconds < 1) throw new Error("Invalid timer duration");
        const timer = setInterval(callback, milliseconds);
        return this.own(() => clearInterval(timer));
    }
    async dispose() {
        if (this.#closed) return [];
        this.#closed = true;
        const errors = [];
        for (const cleanup of this.#cleanups.reverse()) {
            try { await cleanupWithin(cleanup, this.cleanupTimeout); } catch (error) { errors.push(error); }
        }
        this.#cleanups.length = 0;
        this.#known.clear();
        return errors;
    }
}
export class PluginRuntime {
    #plugins = new Map();
    #active = new Map();
    #order = [];
    #queue = Promise.resolve();
    #revision = 0;
    #starting;
    #diagnostics = [];
    #blocked = [];
    #disposed = false;
    constructor({ platform, capabilities = [], plugins = [], services = {}, startTimeout = 5000, cleanupTimeout = 5000 }) {
        this.platform = identifier(platform);
        this.capabilities = new Set(identifiers(capabilities, "host capabilities"));
        this.services = Object.freeze({ ...services });
        if (!Number.isFinite(startTimeout) || startTimeout < 1 || startTimeout > 60000) throw new Error("Invalid start timeout");
        this.startTimeout = startTimeout;
        if (!Number.isFinite(cleanupTimeout) || cleanupTimeout < 1 || cleanupTimeout > 60000) throw new Error("Invalid cleanup timeout");
        this.cleanupTimeout = cleanupTimeout;
        for (const plugin of plugins) {
            const manifest = validateManifest(plugin.manifest);
            if (this.#plugins.has(manifest.id)) throw new Error(`Duplicate plugin: ${manifest.id}`);
            if (typeof plugin.start !== "function") throw new Error(`Missing start function: ${manifest.id}`);
            this.#plugins.set(manifest.id, { manifest, start: plugin.start });
        }
        const visiting = new Set(), visited = new Set();
        const visit = id => {
            if (visiting.has(id)) throw new Error(`Dependency cycle: ${id}`);
            if (visited.has(id)) return;
            const plugin = this.#plugins.get(id);
            if (!plugin) throw new Error(`Missing dependency: ${id}`);
            visiting.add(id);
            for (const dependency of plugin.manifest.dependencies) visit(dependency);
            visiting.delete(id); visited.add(id); this.#order.push(id);
        };
        for (const id of [...this.#plugins.keys()].sort()) visit(id);
    }
    get manifests() { return [...this.#plugins.values()].map(plugin => plugin.manifest); }
    get diagnostics() { return this.#diagnostics.map(item => ({ ...item })); }
    #failure(id, phase, error) {
        const failure = { id, phase, error, message: error?.message || String(error) };
        this.#diagnostics.push({ id, phase, message: failure.message, time: new Date().toISOString() });
        if (this.#diagnostics.length > 100) this.#diagnostics.shift();
        return failure;
    }
    #state(input) {
        const source = object(input) ? input : {};
        const enabled = object(source.enabled) ? source.enabled : {};
        const values = object(source.plugins) ? source.plugins : {};
        return { safeMode: source.safeMode === true,
            enabled: Object.fromEntries(this.manifests.map(manifest => [manifest.id, Object.hasOwn(enabled, manifest.id) && enabled[manifest.id] === true])),
            plugins: Object.fromEntries(this.manifests.map(manifest => [manifest.id, normalizePluginValues(manifest, values[manifest.id])])) };
    }
    #plan(state) {
        const desired = new Set(), blocked = new Map();
        if (state.safeMode) return { desired, blocked: [] };
        for (const id of this.#order) {
            if (!state.enabled[id]) continue;
            const manifest = this.#plugins.get(id).manifest;
            const capability = manifest.capabilities.find(value => !this.capabilities.has(value));
            if (!manifest.platforms.includes(this.platform)) blocked.set(id, "Unsupported platform");
            else if (capability) blocked.set(id, `Missing capability: ${capability}`);
            else desired.add(id);
        }
        // Deterministic conflict resolution, including one-sided declarations.
        for (const id of [...desired].sort()) {
            if (!desired.has(id)) continue;
            for (const other of [...desired].sort()) {
                if (id >= other) continue;
                if (this.#plugins.get(id).manifest.conflicts.includes(other) || this.#plugins.get(other).manifest.conflicts.includes(id)) {
                    desired.delete(other); blocked.set(other, `Conflicts with ${id}`);
                }
            }
        }
        for (const id of this.#order) {
            if (!desired.has(id)) continue;
            const missing = this.#plugins.get(id).manifest.dependencies.find(dependency => !desired.has(dependency));
            if (missing) { desired.delete(id); blocked.set(id, `Dependency not active: ${missing}`); }
        }
        return { desired, blocked: [...blocked].map(([id, reason]) => ({ id, reason })) };
    }
    reconcile(input) {
        if (this.#disposed) return Promise.reject(new Error("Plugin runtime is disposed"));
        const state = this.#state(input), revision = ++this.#revision;
        this.#starting?.abort();
        const operation = this.#queue.then(() => this.#apply(state, revision));
        this.#queue = operation.catch(() => {});
        return operation;
    }
    async #stop(id, errors) {
        const active = this.#active.get(id);
        if (!active) return;
        this.#active.delete(id);
        active.controller.abort();
        for (const error of await active.scope.dispose()) errors.push(this.#failure(id, "stop", error));
    }
    async #apply(state, revision) {
        if (revision !== this.#revision) return { active: [...this.#active.keys()], errors: [], blocked: this.#blocked, stale: true };
        const errors = [], plan = this.#plan(state);
        this.#blocked = plan.blocked;
        const stop = new Set([...this.#active.keys()].filter(id => !plan.desired.has(id) || this.#active.get(id).fingerprint !== JSON.stringify(state.plugins[id])));
        for (const id of this.#order) {
            if (this.#active.has(id) && this.#plugins.get(id).manifest.dependencies.some(dependency => stop.has(dependency))) stop.add(id);
        }
        for (const id of [...this.#order].reverse()) if (stop.has(id)) await this.#stop(id, errors);
        for (const id of this.#order) {
            if (revision !== this.#revision) break;
            if (!plan.desired.has(id) || this.#active.has(id)) continue;
            const plugin = this.#plugins.get(id);
            const missing = plugin.manifest.dependencies.find(dependency => !this.#active.has(dependency));
            if (missing) { this.#blocked.push({ id, reason: `Dependency failed: ${missing}` }); continue; }
            const controller = new AbortController(), scope = new ResourceScope(controller.signal, this.cleanupTimeout);
            this.#starting = controller;
            let timeout, aborted;
            let accepted = false;
            const start = Promise.resolve().then(() => plugin.start(Object.freeze({
                platform: this.platform, settings: Object.freeze(state.plugins[id]), services: this.services, scope, signal: controller.signal
            })));
            try {
                const cancelled = new Promise((_, reject) => {
                    aborted = () => reject(new Error("Plugin start cancelled"));
                    controller.signal.addEventListener("abort", aborted, { once: true });
                });
                const expired = new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Plugin start timed out")), this.startTimeout); });
                const cleanup = await Promise.race([start, cancelled, expired]);
                if (cleanup !== undefined && typeof cleanup !== "function") throw new Error("Plugin start must return cleanup or use its scope");
                if (cleanup) scope.own(cleanup);
                accepted = true;
                if (revision === this.#revision && !controller.signal.aborted) this.#active.set(id, { controller, scope, fingerprint: JSON.stringify(state.plugins[id]) });
                else { controller.abort(); for (const error of await scope.dispose()) errors.push(this.#failure(id, "stop", error)); }
            } catch (error) {
                controller.abort();
                if (revision === this.#revision) errors.push(this.#failure(id, "start", error));
                for (const cleanupError of await scope.dispose()) errors.push(this.#failure(id, "stop", cleanupError));
            } finally {
                clearTimeout(timeout);
                controller.signal.removeEventListener("abort", aborted);
                if (this.#starting === controller) this.#starting = undefined;
                if (!accepted) start.then(async cleanup => {
                    // A late async start can still return cleanup after cancellation/timeout.
                    if (typeof cleanup === "function") { try { await cleanupWithin(cleanup, this.cleanupTimeout); } catch (error) { this.#failure(id, "late-stop", error); } }
                }, () => {});
            }
        }
        return { active: [...this.#active.keys()], errors, blocked: this.#blocked.map(item => ({ ...item })), stale: revision !== this.#revision };
    }
    async dispose() {
        if (this.#disposed) { await this.#queue; return { active: [], errors: [], blocked: [] }; }
        const result = this.reconcile({ safeMode: true });
        this.#disposed = true;
        return result;
    }
}
