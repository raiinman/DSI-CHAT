import test from "node:test";
import assert from "node:assert/strict";
import { FEATURES, FeatureRuntime, normalizeSettings } from "../src/core.mjs";
function enabled(id, safeMode = false) { return { safeMode, enabled: { [id]: true } }; }

test("settings reject malformed values and unknown feature ids", () => {
    assert.deepEqual(normalizeSettings(null), normalizeSettings({}));
    const state = normalizeSettings({ safeMode: "true", enabled: { "signal-theme": "true", rogue: true } });
    assert.equal(state.safeMode, false);
    assert.equal(state.enabled["signal-theme"], false);
    assert.equal(Object.hasOwn(state.enabled, "rogue"), false);
});
test("features start once and dispose when disabled", () => {
    let starts = 0, stops = 0;
    const runtime = new FeatureRuntime([{ id: FEATURES[0].id, start() { starts++; return () => stops++; } }]);
    runtime.reconcile(enabled(FEATURES[0].id));
    runtime.reconcile(enabled(FEATURES[0].id));
    assert.equal(starts, 1);
    runtime.reconcile({});
    assert.equal(stops, 1);
    runtime.dispose();
    assert.equal(stops, 1);
});
test("safe mode stops everything and allows restoration", () => {
    let starts = 0, stops = 0;
    const runtime = new FeatureRuntime([{ id: FEATURES[0].id, start() { starts++; return () => stops++; } }]);
    runtime.reconcile(enabled(FEATURES[0].id));
    assert.deepEqual(runtime.reconcile(enabled(FEATURES[0].id, true)).active, []);
    assert.equal(stops, 1);
    runtime.reconcile(enabled(FEATURES[0].id));
    assert.equal(starts, 2);
});
test("one failed feature cannot stop other features", () => {
    const runtime = new FeatureRuntime([
        { id: FEATURES[0].id, start() { throw new Error("failed"); } },
        { id: FEATURES[1].id, start() { return () => {}; } }
    ]);
    const result = runtime.reconcile({ enabled: { [FEATURES[0].id]: true, [FEATURES[1].id]: true } });
    assert.deepEqual(result.active, [FEATURES[1].id]);
    assert.equal(result.errors[0].phase, "start");
});
test("cleanup failure does not prevent other cleanup", () => {
    let cleaned = false;
    const runtime = new FeatureRuntime([
        { id: FEATURES[0].id, start() { return () => { throw new Error("cleanup"); }; } },
        { id: FEATURES[1].id, start() { return () => { cleaned = true; }; } }
    ]);
    runtime.reconcile({ enabled: { [FEATURES[0].id]: true, [FEATURES[1].id]: true } });
    const result = runtime.dispose();
    assert.equal(cleaned, true);
    assert.equal(result.errors[0].phase, "stop");
});
test("duplicate feature identities are rejected", () => {
    assert.throws(() => new FeatureRuntime([{ id: "x" }, { id: "x" }]), /Duplicate/);
});
