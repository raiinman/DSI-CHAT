import {createScreenPicker} from './screen-picker.mjs';
import {PERMISSIONS,officialURL,channelsURL,localChannelAllowed,previewURLAllowed} from '../security/policy.mjs';
import {app,BrowserWindow,ipcMain,dialog,session,Menu,shell,desktopCapturer} from 'electron';
import {configureDiscordHost} from './discord-host.mjs';
import fs from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {WorkspaceService,createTemplate} from '../workbench/service.mjs';
import {BUILTIN_MANIFESTS} from '../src/plugins/builtins.mjs';
import {normalizePluginSettings} from '../src/plugins/settings.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(here);
if(process.argv.includes('--smoke')){app.disableHardwareAcceleration();const profile=path.join(process.env.DSI_SMOKE_OUTPUT,'user-data');mkdirSync(profile,{recursive:true});app.setPath('userData',profile);}
const workbench=new WorkspaceService({electron:true});
let dashboard,editor,fixture,discord,preview;
let discordHost;
let ideBusy=false;
let settings=normalizePluginSettings({},BUILTIN_MANIFESTS);
let featureQueue=Promise.resolve();
let adapterStatus='Not attached; use the offline fixture first.';
const attachedStyles=new WeakMap();
const attachmentQueues=new WeakMap();
const localOptions={width:1200,height:820,backgroundColor:'#ede1ce',show:!process.argv.includes('--smoke'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(here,'preload.cjs')}};
function lock(window,{remote=false}={}) {
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{ if(remote){if(!officialURL(url))event.preventDefault();}else event.preventDefault(); });
 window.webContents.on('will-attach-webview',event=>event.preventDefault());
 return window;
}
function trusted(event,scope='local',channel) {
 const sender=event.senderFrame;
 const permitted=scope==='ide'?[editor]:[dashboard,editor];
 return sender && permitted.some(window=>window&&!window.isDestroyed()&&event.sender===window.webContents&&sender===window.webContents.mainFrame&&localChannelAllowed(window===editor?'workbench':'dashboard',channel))&&sender.url.startsWith(pathToFileURL(root+path.sep).href);
}
function handle(channel,fn,scope='local'){ipcMain.handle(channel,async(event,...args)=>{if(!trusted(event,scope,channel))throw Error('Untrusted IPC sender');const guarded=scope==='ide'&&!['ide:cancel','ide:stop'].includes(channel);if(guarded&&ideBusy)throw Error('Another workbench action is running. Wait or cancel the test process.');if(guarded)ideBusy=true;try{return await fn(...args);}finally{if(guarded)ideBusy=false;}});}
const validSettings=value=>{
 if(!value||typeof value!=='object'||typeof value.safeMode!=='boolean')throw Error('Invalid settings');
 return normalizePluginSettings(value,BUILTIN_MANIFESTS);
};
async function sharedBundle(){return fs.readFile(path.join(root,'dist/shared/dsi-plugins.js'),'utf8');}
function attach(window,remote=false){
 if(!window||window.isDestroyed())return Promise.resolve();
 const previous=attachmentQueues.get(window)??Promise.resolve();
 const operation=previous.catch(()=>{}).then(()=>applyAttachment(window,remote));
 attachmentQueues.set(window,operation);
 return operation;
}
async function applyAttachment(window,remote=false){
 if(!window||window.isDestroyed())return;
 const url=window.webContents.getURL();
 if(remote&&!channelsURL(url)){adapterStatus='Discord display adapter waits for a channels page. No account has been verified.';return;}
 const bundle=await sharedBundle();
 const contents=window.webContents;
 for(const key of attachedStyles.get(window)??[])await contents.removeInsertedCSS(key);
 attachedStyles.set(window,[]);
 const result=await contents.executeJavaScriptInIsolatedWorld(1001,[{code:bundle+`\n(async()=>{await globalThis.__dsiRuntime?.dispose();const styles=[];globalThis.__dsiRuntime=new DSIPlugins.PluginRuntime({platform:'windows',capabilities:${JSON.stringify(PERMISSIONS.browser.pluginCapabilities)},plugins:DSIPlugins.createBuiltinPlugins(document,{installStyle:(id,css)=>{styles.push({id,css});}})});const runtime=await globalThis.__dsiRuntime.reconcile(${JSON.stringify(settings)});return {active:runtime.active,errors:runtime.errors.map(({id,phase})=>({id,phase})),styles,compatibility:DSIPlugins.inspectDiscordCompatibility({document,url:location.href})};})()`}]);
 const keys=attachedStyles.get(window);
 try{for(const style of result.styles){if(contents.getURL()!==url)throw Error('Page changed; reload to attach plugins');keys.push(await contents.insertCSS(style.css,{cssOrigin:'author'}));}}
 catch(error){for(const key of keys)await contents.removeInsertedCSS(key);attachedStyles.set(window,[]);adapterStatus='Plugin styles could not attach; reload or use safe mode.';throw error;}
 const missing=result.compatibility.plugins.filter(plugin=>result.active.includes(plugin.id)&&plugin.target==='not-found-in-current-context').length;
 adapterStatus=settings.safeMode?'Safe mode: all display plugins paused.':result.errors.length?`${result.errors.length} plugin startup errors; reload or use safe mode.`:`${result.active.length} plugins running in ${remote?'Discord web':'the offline fixture'}${missing?`; ${missing} targets absent here`:''}. Live effects require visual confirmation.`;
}
async function openFixture(){if(fixture&&!fixture.isDestroyed()){fixture.focus();return;}fixture=lock(new BrowserWindow({...localOptions,width:1000,height:700,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}));await fixture.loadFile(path.join(here,'fixture.html'));await attach(fixture);}
async function openWorkbench(){if(editor&&!editor.isDestroyed()){editor.focus();return;}editor=lock(new BrowserWindow({...localOptions,title:'DSI Workbench'}));await editor.loadFile(path.join(root,'workbench/index.html'));}
async function openDiscord(){
 if(discord&&!discord.isDestroyed()){discord.focus();return;}
 const isolated=session.fromPartition('persist:dsi-discord');
 discord=new BrowserWindow({width:1300,height:850,title:'DSI • Discord web',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,session:isolated}});
 const picker=createScreenPicker({parent:discord,ipcMain,BrowserWindow,desktopCapturer,directory:here});
 discordHost=configureDiscordHost({window:discord,session:isolated,dialog,Menu,shell,picker,onReady:target=>attach(target,true)});
 await discordHost.load();
}
async function openPreview(){
 const build=await workbench.build();if(!build.ok)return build;
 if(preview&&!preview.isDestroyed())preview.destroy();
 const plugin=await fs.readFile(await workbench.resolve('.dsi-build/plugin.mjs'),'utf8');
 const bundle=await sharedBundle();
 const isolated=session.fromPartition('dsi-preview-'+crypto.randomUUID());
 const denyProxy=net.createServer(socket=>socket.destroy());await new Promise((resolve,reject)=>{denyProxy.once('error',reject);denyProxy.listen(0,'127.0.0.1',resolve);});
 try{await isolated.setProxy({mode:'fixed_servers',proxyRules:'http://127.0.0.1:'+denyProxy.address().port,proxyBypassRules:'<-loopback>'});}catch(error){denyProxy.close();throw error;}
 isolated.setPermissionRequestHandler((_contents,_permission,callback)=>callback(PERMISSIONS.preview.permissions.includes(_permission)));isolated.setPermissionCheckHandler((_contents,permission)=>PERMISSIONS.preview.permissions.includes(permission));
 isolated.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!previewURLAllowed(details.url)}));
 isolated.on('will-download',event=>event.preventDefault());
 let target;try{
 const css=await fs.readFile(path.join(root,'workbench/style.css'),'utf8');
 const document=(await fs.readFile(path.join(root,'workbench/fixture.html'),'utf8')).replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/,'<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src blob:; style-src \'unsafe-inline\'; frame-src \'none\'; worker-src \'none\'; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">').replace('<link rel="stylesheet" href="style.css">','<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
 target=lock(new BrowserWindow({...localOptions,width:950,height:680,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,session:isolated}}));preview=target;
 target.webContents.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');target.once('closed',()=>denyProxy.close());
 await target.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(document));
 const contents=target.webContents;let destroyed;
 const destruction=new Promise((_,reject)=>{destroyed=()=>reject(Error('Preview stopped before plugin startup completed'));contents.once('destroyed',destroyed);});
 let result;
 try{result=await Promise.race([destruction,contents.executeJavaScript(bundle+`\n(async()=>{const module=await import(URL.createObjectURL(new Blob([${JSON.stringify(plugin)}],{type:'text/javascript'})));const definition=module.default; const expected=${JSON.stringify(build.manifest)}; if(JSON.stringify(DSIPlugins.validateManifest(definition.manifest))!==JSON.stringify(expected))throw Error('plugin.ts manifest differs from manifest.json'); globalThis.__dsiRuntime=new DSIPlugins.PluginRuntime({platform:'windows',capabilities:['styles'],plugins:[definition]}); const result=await globalThis.__dsiRuntime.reconcile({version:2,safeMode:false,enabled:{[definition.manifest.id]:true},plugins:{}});document.querySelector('#preview-status').textContent=JSON.stringify(result,null,2);return result;})()`)]);}finally{contents.removeListener('destroyed',destroyed);}
 return {ok:result.active.includes(build.manifest.id)&&result.errors.length===0,result};
 }catch(error){if(target&&!target.isDestroyed())target.destroy();if(denyProxy.listening)denyProxy.close();throw error;}
}
handle('dsi:status',()=>({settings,manifests:BUILTIN_MANIFESTS,status:adapterStatus,discordHost:discordHost?.snapshot()??{phase:'not-opened'},version:app.getVersion(),platform:process.platform}));
handle('dsi:features',value=>{const requested=validSettings(value);const operation=featureQueue.then(async()=>{settings=requested;await fs.writeFile(path.join(app.getPath('userData'),'dsi-settings.json'),JSON.stringify(settings));await attach(fixture);await attach(discord,true);return {settings,status:adapterStatus};});featureQueue=operation.catch(()=>{});return operation;});
handle('dsi:fixture',async()=>{await openFixture();return {ok:true};});
handle('dsi:discord',async()=>{await openDiscord();return {ok:true};});
handle('dsi:discord-browser',async()=>{await shell.openExternal(PERMISSIONS.discord.origin+'/app');return {ok:true};});
handle('dsi:discord-reload',async()=>{if(!discord||discord.isDestroyed())await openDiscord();else await discordHost.reload();return {ok:true};});
handle('dsi:workbench',async()=>{await openWorkbench();return {ok:true};});
handle('ide:open',async()=>{const selected=await dialog.showOpenDialog(editor,{properties:['openDirectory']});return selected.canceled?null:workbench.open(selected.filePaths[0]);},'ide');
handle('ide:create',async()=>{const selected=await dialog.showOpenDialog(editor,{title:'Select an empty folder for an original plugin',properties:['openDirectory','createDirectory']});if(selected.canceled)return null;await createTemplate(selected.filePaths[0]);return workbench.open(selected.filePaths[0]);},'ide');
for(const [channel,method] of [['files','list'],['read','read'],['save','save'],['diagnose','diagnostics'],['build','build'],['test','test'],['cancel','cancel']])handle('ide:'+channel,(...args)=>workbench[method](...args),'ide');
handle('ide:preview',openPreview,'ide');
handle('ide:stop',async()=>{
 const target=preview;if(!target||target.isDestroyed())return {ok:true,forced:false};
 let timer,forced=false,teardownError;
 try{await Promise.race([target.webContents.executeJavaScript('globalThis.__dsiRuntime?.dispose()'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Preview cleanup exceeded 1000ms; host destroyed.')),PERMISSIONS.preview.gracefulStopMs);})]);}
 catch(error){forced=true;teardownError=error.message;}
 finally{clearTimeout(timer);if(!target.isDestroyed())target.destroy();}
 return {ok:true,forced,...(teardownError?{teardownError}:{})};
},'ide');
handle('ide:package',async()=>{const result=await workbench.package();if(!result.ok)return result;const selected=await dialog.showSaveDialog(editor,{defaultPath:result.filename,filters:[{name:'DSI development plugin',extensions:['dsiplugin']}]});if(selected.canceled)return {cancelled:true};await fs.writeFile(selected.filePath,result.text);return {ok:true,path:selected.filePath,sha256:result.sha256};},'ide');
app.whenReady().then(async()=>{
 session.defaultSession.setPermissionRequestHandler((_contents,permission,callback)=>callback(PERMISSIONS.local.permissions.includes(permission)));
 session.defaultSession.setPermissionCheckHandler((_contents,permission)=>PERMISSIONS.local.permissions.includes(permission));
 session.defaultSession.setDisplayMediaRequestHandler((_request,callback)=>callback(null),{useSystemPicker:false});
 try{settings=validSettings(JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'dsi-settings.json'),'utf8')));}catch{}
 dashboard=lock(new BrowserWindow({...localOptions,height:900,title:'DSI CHAT • Windows'}));await dashboard.loadFile(path.join(here,'index.html'));
 if(process.argv.includes('--smoke'))await runSmoke();
}).catch(error=>{console.error(error);if(process.argv.includes('--smoke'))app.exit(1);});
app.on('window-all-closed',()=>{workbench.cancel();app.quit();});
async function runSmoke(){
 const folder=process.env.DSI_SMOKE_OUTPUT;await fs.mkdir(folder,{recursive:true});
 await openFixture();
 await dashboard.webContents.executeJavaScript(`for(const id of ['compact-messages','reduced-motion']){const input=document.getElementById(id);input.checked=true;input.dispatchEvent(new Event('change'));}`);
 await new Promise(resolve=>setTimeout(resolve,300));
 const styles=attachedStyles.get(fixture)?.length??0;
 if(styles<2)throw Error('Fixture plugins did not attach');
 await dashboard.webContents.executeJavaScript(`const size=document.querySelector('#larger-text-size');size.value='22';size.dispatchEvent(new Event('change'));const larger=document.querySelector('#larger-text');larger.checked=true;larger.dispatchEvent(new Event('change'));`);
 await waitCondition(async()=>await fixture.webContents.executeJavaScript('getComputedStyle(document.querySelector("[data-message-content]")).fontSize')==='22px','Numeric text-size control did not apply');
 await dashboard.webContents.executeJavaScript(`document.querySelector('#safe-mode').checked=true;document.querySelector('#safe-mode').dispatchEvent(new Event('change'));`);
 try{await waitCondition(async()=>{const font=await fixture.webContents.executeJavaScript('getComputedStyle(document.querySelector("[data-message-content]")).fontSize');return (attachedStyles.get(fixture)?.length??0)===0&&font!=='22px';},'Safe mode did not remove styles');}catch(error){throw Error(error.message+JSON.stringify({keys:attachedStyles.get(fixture),settings,status:adapterStatus,font:await fixture.webContents.executeJavaScript('getComputedStyle(document.querySelector("[data-message-content]")).fontSize')}));}
 if(settings.plugins['larger-text'].size!==22||!settings.enabled['larger-text'])throw Error('Safe mode discarded plugin settings');
 const savedSettings=validSettings(JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'dsi-settings.json'),'utf8')));
 if(savedSettings.plugins['larger-text'].size!==22||!savedSettings.safeMode)throw Error('Numeric settings were not persisted');
 await new Promise(resolve=>{dashboard.webContents.once('did-finish-load',resolve);dashboard.webContents.reload();});
 await waitCondition(async()=>await dashboard.webContents.executeJavaScript('document.querySelector("#larger-text-size")?.value==="22"&&document.querySelector("#safe-mode").checked'),'Reload did not preserve text-size setting');
 await dashboard.webContents.executeJavaScript(`document.querySelector('#safe-mode').checked=false;document.querySelector('#safe-mode').dispatchEvent(new Event('change'));`);
 await waitCondition(async()=>await fixture.webContents.executeJavaScript('getComputedStyle(document.querySelector("[data-message-content]")).fontSize')==='22px','Leaving safe mode did not restore configured font size');
 await dashboard.webContents.executeJavaScript(`for(const input of document.querySelectorAll('.feature-box input[type="checkbox"]')){if(input.id==='safe-mode')continue;input.checked=true;}document.querySelector('#signal-theme').dispatchEvent(new Event('change'));`);
 await waitCondition(async()=>await fixture.webContents.executeJavaScript(`document.querySelector('a').title==='https://example.com/docs'&&getComputedStyle(document.querySelector('pre')).whiteSpace==='pre-wrap'&&getComputedStyle(document.querySelector('a')).textDecorationLine==='underline'&&getComputedStyle(document.querySelector('img')).maxWidth==='100%'&&getComputedStyle(document.querySelector('[data-typing-indicator]')).display==='none'&&getComputedStyle(document.querySelector('main')).backgroundColor==='rgb(23, 25, 29)'`),'Semantic-main plugins did not apply under strict CSP');
 if((attachedStyles.get(fixture)?.length??0)!==10)throw Error('Not all ten styles attached');
 const fixturePreferences=fixture.webContents.getLastWebPreferences();
 if(fixturePreferences.nodeIntegration||!fixturePreferences.sandbox||!fixturePreferences.contextIsolation||fixturePreferences.preload)throw Error('Fixture renderer isolation failed');
 await dashboard.webContents.executeJavaScript('window.scrollTo(0,0)');
 await capture(dashboard,path.join(folder,'desktop.png'));
 await capture(fixture,path.join(folder,'fixture.png'));
 await openWorkbench(); const sample=path.join(folder,'sample');await fs.mkdir(sample,{recursive:true});await createTemplate(sample);await workbench.open(sample);
 await editor.webContents.executeJavaScript('window.dispatchEvent(new CustomEvent("dsi-refresh-workspace"))');
 await new Promise(resolve=>setTimeout(resolve,250));
 const original=await workbench.read('plugin.ts');
 await editor.webContents.executeJavaScript(`const source=document.querySelector('#source');source.value+= '\\n// Saved through the real editor control.\\n';source.dispatchEvent(new Event('input'));document.querySelector('#save').click();`);
 await new Promise(resolve=>setTimeout(resolve,200));
 if(!(await workbench.read('plugin.ts')).text.includes('Saved through the real editor'))throw Error('Editor save control failed');
 await editor.webContents.executeJavaScript(`document.querySelector('#source').value+='\\nconst deliberateError: number = "wrong";';document.querySelector('#source').dispatchEvent(new Event('input'));document.querySelector('#save').click();`);
 await new Promise(resolve=>setTimeout(resolve,200));
 await editor.webContents.executeJavaScript(`document.querySelector('#diagnose').click();`);
 await waitFor(editor,'document.querySelector("#diagnostics button")?.textContent.includes("not assignable")','Editor diagnostic control failed');
 await capture(editor,path.join(folder,'workbench-diagnostics.png'));
 await editor.webContents.executeJavaScript(`document.querySelector('#source').value=${JSON.stringify(original.text)};document.querySelector('#source').dispatchEvent(new Event('input'));document.querySelector('#save').click();`);
 await new Promise(resolve=>setTimeout(resolve,200));
 const diagnosis=await workbench.diagnostics();if(!diagnosis.ok)throw Error(JSON.stringify(diagnosis.errors));
 await editor.webContents.executeJavaScript('document.querySelector("#build").click()');
 await waitFor(editor,'document.querySelector("#output").textContent.includes("plugin.mjs")','Editor build control failed');
 await editor.webContents.executeJavaScript('document.querySelector("#test").click()');
 await waitFor(editor,'document.querySelector("#output").textContent.includes("pass 1")','Editor test control failed');
 const tests=await workbench.test();if(!tests.ok)throw Error(tests.output);
 await editor.webContents.executeJavaScript('document.querySelector("#diagnostics").replaceChildren();document.querySelector("#preview").click()');
 await waitFor(editor,'document.querySelector("#output").textContent.includes("dsi-workbench-sample")&&document.querySelector("#output").textContent.includes("active")','Editor preview control failed');
 if(!preview||preview.isDestroyed())throw Error('Editor preview control failed');
 const previewIsolation=await preview.webContents.executeJavaScript('({node:typeof process!=="undefined",bridge:typeof dsiDesktop!=="undefined"})');
 if(previewIsolation.node||previewIsolation.bridge)throw Error('Plugin preview gained privileged APIs');
 await capture(editor,path.join(folder,'workbench.png'));
 await capture(preview,path.join(folder,'preview.png'));
 await editor.webContents.executeJavaScript('document.querySelector("#stop").click()');await new Promise(resolve=>setTimeout(resolve,150));if(!preview.isDestroyed())throw Error('Editor stop control failed');
 await editor.webContents.executeJavaScript('document.querySelector("#output").textContent="Starting forced-teardown test…";document.querySelector("#preview").click()');
 await waitFor(editor,'document.querySelector("#output").textContent.includes("dsi-workbench-sample")&&document.querySelector("#output").textContent.includes("active")','Second preview control failed');
 const hangingPreview=preview;
 await hangingPreview.webContents.executeJavaScript('globalThis.__dsiRuntime.dispose=()=>new Promise(()=>{});true');
 const stopStarted=Date.now();
 await editor.webContents.executeJavaScript('document.querySelector("#stop").click()');
 await waitFor(editor,'document.querySelector("#output").textContent.includes("forced")&&document.querySelector("#output").textContent.includes("1000ms")','Bounded preview teardown failed');
 const forcedStopMs=Date.now()-stopStarted;
 if(!hangingPreview.isDestroyed()||forcedStopMs>1600)throw Error('Hanging preview was not destroyed within the stop deadline');
 const artifact=await workbench.package();if(!artifact.ok)throw Error('Package failed');await fs.writeFile(path.join(folder,artifact.filename),artifact.text);
 await fs.writeFile(path.join(folder,'result.json'),JSON.stringify({ok:true,styles,numericSettings:{size:22,computedFont:'22px',safeModeRetained:true,reloadPersisted:true},previewIsolation,forcedStopMs,diagnosis,tests,artifact:{sha256:artifact.sha256},electron:process.versions.electron},null,2));app.exit(0);
}
async function waitFor(window,expression,message){for(let n=0;n<200;n++){if(await window.webContents.executeJavaScript(expression))return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error(message+': '+await window.webContents.executeJavaScript('document.querySelector("#output").textContent'));}
async function waitCondition(condition,message){for(let n=0;n<200;n++){if(await condition())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error(message);}
async function capture(window,filename){for(let attempt=0;attempt<3;attempt++){try{await window.webContents.capturePage(undefined,{stayHidden:true});await new Promise(resolve=>setTimeout(resolve,150));const image=await window.webContents.capturePage(undefined,{stayHidden:true});if(image.isEmpty())throw Error('Empty screenshot');await fs.writeFile(filename,image.toPNG());return;}catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,150));}}}
