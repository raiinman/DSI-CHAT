import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FEATURES } from "../src/core.mjs";
import { browserFeatures } from "../src/features.mjs";
import { Script } from "node:vm";

test("browser features own and remove their styles", () => {
    const nodes = [];
    const document = {
        createElement(tag) {
            assert.equal(tag, "style");
            return { dataset: {}, remove() { nodes.splice(nodes.indexOf(this), 1); } };
        },
        head: { append(node) { nodes.push(node); } }
    };
    const definitions = browserFeatures(document);
    for (const feature of definitions) {
        const cleanup = feature.start();
        assert.equal(nodes[0].dataset.dsiFeature, feature.id);
        assert.ok(nodes[0].textContent.length > 20);
        cleanup();
        assert.equal(nodes.length, 0);
    }
    assert.equal(definitions.length, FEATURES.length);
});
test("extension requests local storage and runs only on Discord channel pages", async () => {
    const manifest = JSON.parse(await readFile(new URL("../browser/manifest.json", import.meta.url)));
    assert.deepEqual(manifest.permissions, ["storage"]);
    assert.deepEqual(manifest.content_scripts[0].matches, ["https://discord.com/channels/*"]);
    assert.equal(manifest.content_scripts[0].world, "ISOLATED");
    assert.equal(manifest.update_url, undefined);
});
test("adapter ignores stale initial settings after a storage change", async () => {
    const source = await readFile(new URL("../src/content.mjs", import.meta.url), "utf8");
    let resolveInitial, listener;
    const applied = [];
    const context = {
        FeatureRuntime: class { reconcile(value) { applied.push(value); return { errors: [] }; } dispose() {} },
        browserFeatures: () => [], document: {},
        SETTINGS_KEY: "settings", console,
        chrome: { storage: {
            local: { get: () => new Promise(resolve => { resolveInitial = resolve; }) },
            onChanged: { addListener(fn) { listener = fn; } }
        } },
        window: { addEventListener() {} }
    };
    new Script(source).runInNewContext(context);
    listener({ settings: { newValue: { safeMode: true } } }, "local");
    resolveInitial({ settings: { safeMode: false } });
    await Promise.resolve();
    assert.equal(applied.length, 1);
    assert.equal(applied[0].safeMode, true);
});
