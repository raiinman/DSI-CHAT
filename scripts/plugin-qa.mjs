import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

// Real isolated extension/storage, with Discord's URL intercepted by a local fixture.
// Never connect to Discord or install into the user's normal browser profile.
const folder = resolve('.cache/plugin-qa-extension');
const out = resolve('.cache/plugin-screenshots');
await mkdir(out, { recursive: true });
await cp('dist/chromium', folder, { recursive: true });
const key = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({type:'spki', format:'der'});
const id = [...createHash('sha256').update(key).digest().subarray(0,16)]
    .map(byte => String.fromCharCode(97+(byte>>4), 97+(byte&15))).join('');
const manifest = JSON.parse(await readFile(`${folder}/manifest.json`, 'utf8'));
manifest.key = key.toString('base64'); // Test identity only; production permissions are unchanged.
await writeFile(`${folder}/manifest.json`, JSON.stringify(manifest));
const context = await chromium.launchPersistentContext('', {channel:'chromium', headless:true,
    args:[`--disable-extensions-except=${folder}`, `--load-extension=${folder}`]});
const errors=[];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
await context.route('https://**/*', route => route.request().url()==='https://discord.com/channels/@me'
    ? route.fulfill({contentType:'text/html', body:`<!doctype html><html><head><title>DSI controlled fixture</title>
    <style>body{background:#eee;color:#222;font:16px system-ui;padding:32px}article{padding:24px;border:1px solid #888}pre{white-space:pre}a{color:#267}img{width:1800px}.typing{display:block}.pulse{animation:blink 1s infinite}@keyframes blink{to{opacity:.5}}</style></head>
    <body><h1>DSI browser fixture</h1><p>Original plugins against local sample markup. No account connection.</p>
    <main role="main"><div role="log"><article id="chat-messages-1" class="message_" ><b>Local tester</b>
    <p class="messageContent_" data-message-content>Readable local text.</p><time datetime="2026-10-03T12:00:00Z" title="Original timestamp">12:00</time>
    <p><a href="https://example.com/docs" title="Original link">Documentation</a></p><pre>const originalDSI = true;</pre>
    <img alt="Local image fixture" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1800' height='60'%3E%3Crect width='1800' height='60' fill='%237bb'/%3E%3C/svg%3E"></article></div>
    <div data-typing-indicator class="typing pulse">Sample typing indicator</div><button>Keyboard focus target</button></main></body></html>`})
    : route.abort());
try {
    const fixture=await context.newPage(); await fixture.goto('https://discord.com/channels/@me');
    const popup=await context.newPage(); await popup.goto(`chrome-extension://${id}/popup.html`);
    await popup.setViewportSize({width:370,height:640});
    await popup.waitForFunction(()=>!document.getElementById('safe-mode').disabled);
    assert.equal(await popup.locator('[data-plugin]').count(),12);
    assert.equal(await fixture.locator('style[data-dsi-plugin]').count(),0);
    await popup.screenshot({path:`${out}/popup-default.png`,fullPage:true});
    for (const checkbox of await popup.locator('[data-plugin]').all()) {
        await checkbox.check(); await popup.waitForFunction(()=>!document.getElementById('safe-mode').disabled);
    }
    await fixture.waitForFunction(()=>document.querySelectorAll('style[data-dsi-plugin]').length===10);
    await fixture.waitForFunction(()=>document.querySelector('a').title==='https://example.com/docs');
    assert.notEqual(await fixture.locator('time').getAttribute('title'),'Original timestamp');
    assert.equal(await fixture.locator('[data-typing-indicator]').isVisible(),false);
    assert.equal(await fixture.locator('[data-message-content]').evaluate(e=>getComputedStyle(e).fontSize),'18px');
    assert.equal(await fixture.locator('pre').evaluate(e=>getComputedStyle(e).whiteSpace),'pre-wrap');
    assert.equal(await fixture.locator('a').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');
    assert.equal(await fixture.locator('img').evaluate(e=>getComputedStyle(e).maxWidth),'100%');
    assert.equal(await fixture.locator('[role="main"]').evaluate(e=>getComputedStyle(e).color),'rgb(238, 234, 227)');
    await fixture.locator('button').focus();
    assert.equal(await fixture.locator('button').evaluate(e=>getComputedStyle(e).outlineWidth),'3px');
    await popup.locator('main').evaluate(e=>e.scrollTop=0);
    await popup.screenshot({path:`${out}/popup-enabled.png`,fullPage:true});
    await fixture.screenshot({path:`${out}/fixture-enabled.png`,fullPage:true});
    await fixture.locator('a').evaluate(e=>e.setAttribute('href','https://example.org/changed'));
    await fixture.waitForFunction(()=>document.querySelector('a').title==='https://example.org/changed');
    await fixture.locator('a').evaluate(e=>e.setAttribute('href','javascript:void(0)'));
    await fixture.waitForFunction(()=>document.querySelector('a').title==='Original link');
    await popup.locator('#plugin-filter').fill('timestamp');
    assert.equal(await popup.locator('.feature:visible').count(),1);
    await popup.locator('#plugin-filter').fill('no-such-plugin');
    assert.match(await popup.locator('#filter-result').innerText(),/No matching/);
    await popup.screenshot({path:`${out}/popup-empty.png`,fullPage:true});
    await popup.locator('#plugin-filter').fill('');
    await popup.locator('#safe-mode').check();
    await fixture.waitForFunction(()=>document.querySelectorAll('style[data-dsi-plugin]').length===0);
    assert.equal(await fixture.locator('time').getAttribute('title'),'Original timestamp');
    assert.equal(await fixture.locator('[data-typing-indicator]').isVisible(),true);
    assert.equal(await popup.locator('[data-plugin]:checked').count(),12);
    await popup.reload(); await popup.waitForFunction(()=>!document.getElementById('safe-mode').disabled);
    assert.equal(await popup.locator('#safe-mode').isChecked(),true);
    assert.equal(await popup.locator('[data-plugin]:checked').count(),12);
    await popup.screenshot({path:`${out}/popup-safe-mode.png`,fullPage:true});
    await popup.locator('#safe-mode').uncheck();
    await fixture.waitForFunction(()=>document.querySelectorAll('style[data-dsi-plugin]').length===10);
    await fixture.reload();
    await fixture.waitForFunction(()=>document.querySelectorAll('style[data-dsi-plugin]').length===10);
    assert.deepEqual(errors,[]);
    await writeFile(`${out}/report.json`,JSON.stringify({actualExtension:true,plugins:12,safeMode:true,
        reloadPersistence:true,ownedTooltipCleanup:true,networkIntercepted:true,liveDiscord:false},null,2)+'\n');
    console.log('Browser plugin QA passed: 12 controls, real isolated extension/storage, reversible effects, search, safe mode, reload. Controlled fixture only.');
} finally {await context.close();}
