import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "../.cache/browser-qa/node_modules/playwright/index.mjs";

const root = resolve("dist/site");
const server = createServer(async (request, response) => {
    try {
        const file = resolve(root, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname), request.url === "/" ? "index.html" : "");
        if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
        const types = { ".html": "text/html", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png" };
        response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
        response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
await mkdir(".cache/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).waitFor();
    assert.equal(await page.locator(".send").isDisabled(), true);
    await page.locator("#message-input").fill("Operator draft");
    await page.locator("#contacts .contact").filter({ hasText: "Avery" }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "");
    await page.locator("#message-input").fill("Avery draft");
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "Operator draft");
    await page.getByRole("tab", { name: "Avery", exact: true }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "Avery draft");
    await page.locator("#message-input").press("Enter");
    assert.match(await page.locator("#messages").innerText(), /Avery draft/);
    assert.equal(await page.locator("#message-input").inputValue(), "");
    await page.locator("#message-input").fill("<img src=x onerror=alert(1)>");
    await page.locator(".send").click();
    assert.equal(await page.locator("#messages img").count(), 0);
    await page.locator("#contact-search").fill("nobody matches");
    assert.equal(await page.locator("#empty-search").isVisible(), true);
    await page.locator("#contact-search").fill("");
    await page.locator("#presence").selectOption("away");
    assert.match(await page.locator("#self-orb").getAttribute("class"), /away/);
    await page.locator("#preferences-chat").click();
    assert.equal(await page.locator("#preferences").evaluate(el => el.open), true);
    await page.locator("#compact-messages").check();
    await page.locator("#reduced-motion").check();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "none");
    await page.locator("#safe-mode").check();
    assert.equal(await page.locator("#compact-messages").isDisabled(), true);
    await page.locator("#safe-mode").uncheck();
    assert.equal(await page.locator("#compact-messages").isChecked(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#preferences").evaluate(el => el.open), false);
    assert.equal(await page.locator("#preferences-chat").evaluate(el => el === document.activeElement), true);
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).click();
    await page.screenshot({ path: ".cache/screenshots/desktop.png", fullPage: true });
    for (const width of [390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Horizontal overflow at " + width);
        await page.locator("#preferences-open").click();
        assert.equal(await page.locator("#preferences").isVisible(), true);
        const box = await page.locator("#preferences").boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
        await page.keyboard.press("Escape");
        await page.screenshot({ path: ".cache/screenshots/" + width + ".png", fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log("Browser QA passed: drafts, conversations, composition, literal text, contact search, presence, modal focus, safe mode, reduced motion and 390/768/1440 layouts.");
} finally { await browser.close(); server.close(); }
