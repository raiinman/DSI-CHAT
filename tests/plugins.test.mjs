import test from "node:test";
import assert from "node:assert/strict";
import { PluginRuntime, ResourceScope, validateManifest } from "../src/plugins/runtime.mjs";
import { normalizePluginSettings, migratePluginSettings, PLUGIN_SETTINGS_KEY, LEGACY_SETTINGS_KEY } from "../src/plugins/settings.mjs";
function plugin(id, start = () => {}, extra = {}) {
    return { manifest: { id, version: "1.0.0", apiVersion: 1, platforms: ["browser"], capabilities: [], dependencies: [], conflicts: [], settings: {}, ...extra }, start };
}
function host(plugins, extra = {}) { return new PluginRuntime({ platform: "browser", capabilities: ["styles"], plugins, ...extra }); }
const enabled = (...ids) => ({ enabled: Object.fromEntries(ids.map(id => [id, true])) });
test("plugin manifests reject incompatible APIs, unsafe IDs and invalid settings contracts", () => {
    assert.throws(() => validateManifest(plugin("ok", undefined, { apiVersion: 2 }).manifest), /API/);
    assert.throws(() => validateManifest(plugin("__proto__").manifest), /identifier/);
    assert.throws(() => validateManifest(plugin("ok", undefined, { settings: { size: { type: "number", default: 3, min: 5 } } }).manifest), /default/);
    assert.throws(() => validateManifest(plugin("ok", undefined, { settings: { color: { type: "enum", default: "red", values: ["blue"] } } }).manifest), /enum/);
});
test("registry rejects duplicates, missing dependencies and dependency cycles", () => {
    assert.throws(() => host([plugin("a"), plugin("a")]), /Duplicate/);
    assert.throws(() => host([plugin("a", undefined, { dependencies: ["missing"] })]), /Missing dependency/);
    assert.throws(() => host([plugin("a", undefined, { dependencies: ["b"] }), plugin("b", undefined, { dependencies: ["a"] })]), /cycle/);
});
test("disabled defaults and safe mode preserve independent choices", async () => {
    let starts = 0, stops = 0;
    const runtime = host([plugin("a", () => { starts++; return () => stops++; })]);
    assert.deepEqual((await runtime.reconcile({})).active, []);
    await runtime.reconcile(enabled("a"));
    await runtime.reconcile(enabled("a"));
    assert.equal(starts, 1);
    await runtime.reconcile({ ...enabled("a"), safeMode: true });
    assert.equal(stops, 1);
    await runtime.reconcile(enabled("a"));
    assert.equal(starts, 2);
    await runtime.dispose();
    await assert.rejects(runtime.reconcile(enabled("a")), /disposed/);
});
test("dependencies start first and dependents stop first", async () => {
    const order = [];
    const make = (id, dependencies = []) => plugin(id, () => { order.push("start:" + id); return () => order.push("stop:" + id); }, { dependencies });
    const runtime = host([make("a", ["z"]), make("z")]);
    const result = await runtime.reconcile(enabled("a", "z"));
    assert.deepEqual(result.active, ["z", "a"]);
    await runtime.dispose();
    assert.deepEqual(order, ["start:z", "start:a", "stop:a", "stop:z"]);
});
test("dependency settings restart dependent resources in correct order", async () => {
    const order = [];
    const runtime = host([
        plugin("a", () => { order.push("start:a"); return () => order.push("stop:a"); }, { dependencies: ["b"] }),
        plugin("b", () => { order.push("start:b"); return () => order.push("stop:b"); }, { settings: { value: { type: "number", default: 1 } } })
    ]);
    await runtime.reconcile(enabled("a", "b"));
    order.length = 0;
    await runtime.reconcile({ ...enabled("a", "b"), plugins: { b: { value: 2 } } });
    assert.deepEqual(order, ["stop:a", "stop:b", "start:b", "start:a"]);
    await runtime.dispose();
});
test("unsupported platforms, missing capabilities and disabled dependencies are explicit", async () => {
    const runtime = host([plugin("mobile", undefined, { platforms: ["android"] }), plugin("native", undefined, { capabilities: ["native.views"] }), plugin("dependent", undefined, { dependencies: ["base"] }), plugin("base")]);
    const result = await runtime.reconcile(enabled("mobile", "native", "dependent"));
    assert.deepEqual(result.active, []);
    assert.equal(result.blocked.length, 3);
    assert.match(result.blocked.find(item => item.id === "mobile").reason, /platform/);
    assert.match(result.blocked.find(item => item.id === "native").reason, /capability/);
    await runtime.dispose();
});
test("one-sided conflicts resolve deterministically independent of registration order", async () => {
    const runtime = host([plugin("z", undefined, { conflicts: ["a"] }), plugin("a")]);
    const result = await runtime.reconcile(enabled("a", "z"));
    assert.deepEqual(result.active, ["a"]);
    assert.match(result.blocked[0].reason, /Conflicts/);
    await runtime.dispose();
});
test("failed starts roll back owned resources and do not start dependent plugins", async () => {
    let cleaned = 0, dependent = 0;
    const runtime = host([
        plugin("a", ({ scope }) => { scope.own(() => cleaned++); throw new Error("start failed"); }),
        plugin("b", () => dependent++, { dependencies: ["a"] }), plugin("good")
    ]);
    const result = await runtime.reconcile(enabled("a", "b", "good"));
    assert.equal(cleaned, 1);
    assert.equal(dependent, 0);
    assert.deepEqual(result.active, ["good"]);
    assert.equal(result.errors[0].phase, "start");
    assert.match(result.blocked.find(item => item.id === "b").reason, /failed/);
    await runtime.dispose();
});
test("cleanup errors are isolated and duplicate cleanup registration runs once", async () => {
    let count = 0;
    const runtime = host([plugin("a", ({ scope }) => {
        const cleanup = () => { count++; };
        scope.own(cleanup); scope.own(cleanup);
        scope.own(() => { throw new Error("stop failed"); });
        return cleanup;
    }), plugin("b", ({ scope }) => scope.own(() => count++))]);
    await runtime.reconcile(enabled("a", "b"));
    const result = await runtime.dispose();
    assert.equal(count, 2);
    assert.equal(result.errors.length, 1);
    assert.equal(runtime.diagnostics[0].phase, "stop");
});
test("rapid reconciliation skips obsolete queued starts", async () => {
    let starts = 0;
    const runtime = host([plugin("a", () => { starts++; })]);
    const first = runtime.reconcile(enabled("a"));
    const last = runtime.reconcile({ safeMode: true });
    assert.equal((await first).stale, true);
    assert.deepEqual((await last).active, []);
    assert.equal(starts, 0);
    await runtime.dispose();
});
test("safe mode cancels an in-flight asynchronous start and cleans late resources", async () => {
    let finish, begun, cleaned = 0;
    const started = new Promise(resolve => begun = resolve);
    const runtime = host([plugin("a", ({ scope }) => { scope.own(() => cleaned++); begun(); return new Promise(resolve => finish = resolve); })]);
    const first = runtime.reconcile(enabled("a"));
    await started;
    const stop = runtime.reconcile({ safeMode: true });
    assert.deepEqual((await stop).active, []);
    assert.equal(cleaned, 1);
    finish(() => cleaned++);
    await first; await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(cleaned, 2);
    await runtime.dispose();
});
test("hung starts time out so other plugins can continue", async () => {
    const runtime = host([plugin("a", () => new Promise(() => {})), plugin("b")], { startTimeout: 10 });
    const result = await runtime.reconcile(enabled("a", "b"));
    assert.deepEqual(result.active, ["b"]);
    assert.match(result.errors[0].message, /timed out/);
    await runtime.dispose();
});
test("resource scopes stop listeners/styles and reject late mutations", async () => {
    const target = new EventTarget(), nodes = [];
    const document = { createElement: () => ({ dataset: {}, remove() { nodes.splice(nodes.indexOf(this), 1); } }), head: { append: node => nodes.push(node) } };
    const scope = new ResourceScope();
    let calls = 0;
    scope.listen(target, "test", () => calls++);
    scope.style(document, "a", "body { color: red; }");
    target.dispatchEvent(new Event("test"));
    assert.equal(calls, 1);
    await scope.dispose();
    target.dispatchEvent(new Event("test"));
    assert.equal(calls, 1); assert.equal(nodes.length, 0);
    assert.throws(() => scope.style(document, "a", ""), /closed/);
});
test("settings migrate legacy choices, repair values and discard unknown plugin data", () => {
    const manifests = [validateManifest(plugin("a", undefined, { settings: { size: { type: "number", default: 1, min: 1, max: 3 }, mode: { type: "enum", values: ["day", "night"], default: "day" } } }).manifest)];
    const result = migratePluginSettings({ [LEGACY_SETTINGS_KEY]: { safeMode: true, enabled: { a: true } } }, manifests);
    assert.equal(result.migrated, true); assert.equal(result.settings.version, 2); assert.equal(result.settings.enabled.a, true); assert.equal(result.settings.safeMode, true);
    const repaired = normalizePluginSettings({ enabled: { a: "true", rogue: true }, plugins: { a: { size: Infinity, mode: "rogue" }, rogue: {} } }, manifests);
    assert.deepEqual(repaired.plugins.a, { size: 1, mode: "day" }); assert.equal(repaired.enabled.a, false); assert.equal(Object.hasOwn(repaired.enabled, "rogue"), false);
    const current = migratePluginSettings({ [PLUGIN_SETTINGS_KEY]: { version: 2, enabled: { a: true } }, [LEGACY_SETTINGS_KEY]: { safeMode: true } }, manifests);
    assert.equal(current.migrated, false); assert.equal(current.settings.safeMode, false);
});
