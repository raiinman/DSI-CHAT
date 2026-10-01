import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
test("browser packages identify DSI and preserve runtime filenames", async () => {
    for (const file of ["manifest.json", "manifestv2.json"]) {
        const manifest = JSON.parse(await read(`apps/desktop/browser/${file}`));
        assert.equal(manifest.name, "DSI CHAT Web");
        assert.equal(manifest.homepage_url, "https://github.com/raiinman/DSI-CHAT");
        assert.ok(manifest.content_scripts.some(script => script.js.includes("dist/Equicord.js")));
    }
});
test("DSI scripts build standalone targets without an upstream updater", async () => {
    const script = await read("scripts/run.mjs");
    assert.match(script, /"--standalone", "--disable-updater"/);
    assert.match(script, /"buildWeb", "--standalone"/);
});
test("upstream license and original fork notices survive integration", async () => {
    assert.match(await read("apps/mobile/LICENSE"), /BSD/);
    assert.match(await read("apps/desktop/LICENSE"), /GNU GENERAL PUBLIC LICENSE/);
    assert.match(await read("legacy/vendetta/LICENSE"), /Team Vendetta/);
});
test("feature catalog preserves plugin origins and marks Android ports honestly", async () => {
    const catalog = JSON.parse(await read("catalog/features.json"));
    assert.ok(catalog.desktopPlugins.length > 200);
    assert.ok(catalog.desktopPlugins.some(plugin => plugin.origin === "Vencord"));
    assert.ok(catalog.desktopPlugins.some(plugin => plugin.origin === "Equicord"));
    assert.ok(catalog.desktopPlugins.every(plugin => plugin.android === "requires-port"));
    const accounts = catalog.desktopPlugins.find(plugin => plugin.name === "UnlimitedAccounts");
    assert.ok(accounts.desktop);
    assert.ok(accounts.browser);
});
