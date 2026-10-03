import test from "node:test";
import assert from "node:assert/strict";
import { attachBrowserRuntime } from "../src/plugins/browser-adapter.mjs";
import { PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY } from "../src/plugins/settings.mjs";
function fixture(get, set = async () => {}) {
    let changed;
    const window = new EventTarget(), applied = [], warnings = [], removed = [];
    const storage = { local: { get, set }, onChanged: { addListener(fn) { changed = fn; }, removeListener(fn) { removed.push(fn); } } };
    const runtime = { async reconcile(value) { applied.push(value); return { errors: [], blocked: [] }; }, async dispose() { applied.push("disposed"); } };
    const adapter = attachBrowserRuntime({ storage, window, runtime, warn: (...args) => warnings.push(args) });
    return { adapter, window, applied, warnings, removed, change: (...args) => changed(...args) };
}
test("plugin browser adapter does not let stale initial reads overwrite a storage update", async () => {
    let finish;
    const env = fixture(() => new Promise(resolve => finish = resolve));
    env.change({ [PLUGIN_SETTINGS_KEY]: { newValue: { version: 2, safeMode: true } } }, "local");
    finish({ [PLUGIN_SETTINGS_KEY]: { version: 2, safeMode: false } });
    await env.adapter.ready;
    assert.equal(env.applied.length, 1); assert.equal(env.applied[0].safeMode, true);
    await env.adapter.dispose();
});
test("plugin browser migration preserves original choices and reports storage failure honestly", async () => {
    const env = fixture(async () => ({ [LEGACY_SETTINGS_KEY]: { enabled: { "compact-messages": true }, safeMode: true } }), async () => { throw new Error("quota"); });
    await env.adapter.ready;
    assert.equal(env.applied[0].enabled["compact-messages"], true); assert.equal(env.applied[0].safeMode, true);
    assert.equal(env.warnings[0][1], "migration");
    await env.adapter.dispose();
});
test("persisted pages suspend plugins and re-read storage when restored", async () => {
    const env = fixture(async () => ({ [PLUGIN_SETTINGS_KEY]: { version: 2, enabled: { "readable-code": true } } }));
    await env.adapter.ready;
    const hide = new Event("pagehide"); hide.persisted = true; env.window.dispatchEvent(hide);
    await Promise.resolve(); assert.equal(env.applied.at(-1).safeMode, true);
    const show = new Event("pageshow"); show.persisted = true; env.window.dispatchEvent(show);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(env.applied.at(-1).enabled["readable-code"], true);
    await env.adapter.dispose(); assert.equal(env.removed.length, 1);
});
test("disposed pages ignore pending reads and later storage changes", async () => {
    let finish;
    const env = fixture(() => new Promise(resolve => finish = resolve));
    await env.adapter.dispose();
    finish({ [PLUGIN_SETTINGS_KEY]: { version: 2, enabled: { "signal-theme": true } } });
    await env.adapter.ready;
    env.change({ [PLUGIN_SETTINGS_KEY]: { newValue: { version: 2, enabled: { "signal-theme": true } } } }, "local");
    assert.deepEqual(env.applied, ["disposed"]);
});
