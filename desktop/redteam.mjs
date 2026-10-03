import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(repo,'.cache','desktop-redteam-'+Date.now());await fs.mkdir(output,{recursive:true});
let source=await fs.readFile(path.join(repo,'desktop/main.mjs'),'utf8');
for(const specifier of ['./discord-host.mjs','../workbench/service.mjs','../src/plugins/builtins.mjs','../src/plugins/settings.mjs'])source=source.replace(JSON.stringify(specifier),JSON.stringify(pathToFileURL(path.resolve(repo,'desktop',specifier)).href)).replace("'"+specifier+"'",JSON.stringify(pathToFileURL(path.resolve(repo,'desktop',specifier)).href));
source=source.replace('const here=path.dirname(fileURLToPath(import.meta.url));','const here='+JSON.stringify(path.join(repo,'desktop'))+';');
source=source.replace("ipcMain.handle(channel,async(event,...args)=>","registerRedteamHandler(channel,async(event,...args)=>");
source=source.replace('if(process.argv.includes(\'--smoke\'))await runSmoke();','if(process.argv.includes(\'--smoke\'))await runRedteam();');
source=`import http from 'node:http';\nimport dgram from 'node:dgram';\nimport assert from 'node:assert/strict';\nconst redteamHandlers=new Map();function registerRedteamHandler(channel,handler){redteamHandlers.set(channel,handler);ipcMain.handle(channel,handler);}\n`+source;
source+=String.raw`
async function runRedteam(){
 const folder=process.env.DSI_SMOKE_OUTPUT,results={electron:process.versions.electron,controlledFixturesOnly:true};
 const report=async()=>fs.writeFile(path.join(folder,'result.json'),JSON.stringify(results,null,2));
 let server,rogue,udp,tcp;
 try{
  await openWorkbench();const sample=path.join(folder,'selected');await createTemplate(sample);await workbench.open(sample);
  const event=()=>({sender:editor.webContents,senderFrame:editor.webContents.mainFrame});
  const invoke=(name,...args)=>redteamHandlers.get(name)(event(),...args);
  const dashboardRejection=await dashboard.webContents.executeJavaScript('dsiDesktop.read("plugin.ts").then(()=>"ACCEPTED",error=>error.message)');assert.match(dashboardRejection,/Untrusted/);results.dashboardIdeRejected=true;
  rogue=new BrowserWindow({...localOptions,show:false});await rogue.loadFile(path.join(here,'index.html'));
  const rogueRejection=await rogue.webContents.executeJavaScript('dsiDesktop.status().then(()=>"ACCEPTED",error=>error.message)');assert.match(rogueRejection,/Untrusted/);results.rogueRendererRejected=true;rogue.destroy();
  await editor.webContents.executeJavaScript('const frame=document.createElement("iframe");frame.src="fixture.html";document.body.append(frame);true');await new Promise(resolve=>setTimeout(resolve,300));
  const frame=editor.webContents.mainFrame.frames[0];assert.ok(frame);await assert.rejects(redteamHandlers.get('ide:read')({sender:editor.webContents,senderFrame:frame},'plugin.ts'),/Untrusted/);results.subframeHandlerRejected=true;results.subframeBridge=await frame.executeJavaScript('typeof dsiDesktop');
  let requests=[];server=http.createServer((request,response)=>{requests.push(request.url);response.end('CONTROLLED_NETWORK_FIXTURE');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
  const external=path.join(folder,'outside-workspace.html');await fs.writeFile(external,'<!doctype html><p>CONTROLLED_OUTSIDE_HTML_SENTINEL</p><img src="http://127.0.0.1:'+port+'/nested-file-frame">');
  const original=await workbench.read('plugin.ts');const attack=original.text.replace('start(context) {','start(context) {\nconst frame=document.createElement("iframe");frame.id="outside-probe";frame.src='+JSON.stringify(pathToFileURL(external).href)+';document.body.append(frame);\nfetch("http://127.0.0.1:'+port+'/direct-fetch").catch(()=>{});const image=new Image();image.src="http://127.0.0.1:'+port+'/direct-image";');await workbench.save({...original,text:attack});assert.equal((await openPreview()).ok,true);await new Promise(resolve=>setTimeout(resolve,1500));
  results.previewPreferences=preview.webContents.getLastWebPreferences();results.previewAPIs=await preview.webContents.executeJavaScript('({process:typeof process,require:typeof require,bridge:typeof dsiDesktop})');
  results.externalFileFrame=await preview.webContents.executeJavaScript('(()=>{try{return document.querySelector("#outside-probe").contentDocument?.body.textContent||"BLOCKED";}catch(error){return error.message;}})()');results.localNetworkRequests=requests;
  assert.ok(!results.externalFileFrame.includes('CONTROLLED_OUTSIDE_HTML_SENTINEL'));assert.deepEqual(requests,[]);
  udp=dgram.createSocket('udp4');let packets=0;udp.on('message',()=>packets++);await new Promise(resolve=>udp.bind(0,'127.0.0.1',resolve));const udpPort=udp.address().port;
  results.webRTC=await preview.webContents.executeJavaScript('(async()=>{try{globalThis.__qaPeer=new RTCPeerConnection({iceServers:[{urls:"stun:127.0.0.1:'+udpPort+'"}]});__qaPeer.createDataChannel("controlled");await __qaPeer.setLocalDescription(await __qaPeer.createOffer());return "CREATED";}catch(error){return error.message;}})()');await new Promise(resolve=>setTimeout(resolve,1800));results.webRTCUDPRequests=packets;await preview.webContents.executeJavaScript('globalThis.__qaPeer?.close();true');assert.equal(packets,0);
  let connections=0;tcp=net.createServer(socket=>{connections++;socket.destroy();});await new Promise(resolve=>tcp.listen(0,'127.0.0.1',resolve));const tcpPort=tcp.address().port,priorPackets=packets;
  assert.equal(preview.webContents.getWebRTCIPHandlingPolicy(),'disable_non_proxied_udp');await preview.webContents.executeJavaScript('(async()=>{globalThis.__qaPeer=new RTCPeerConnection({iceServers:[{urls:"stun:127.0.0.1:'+udpPort+'"},{urls:"turn:127.0.0.1:'+tcpPort+'?transport=tcp",username:"fixture",credential:"fixture"}]});__qaPeer.createDataChannel("controlled");await __qaPeer.setLocalDescription(await __qaPeer.createOffer());})()');await new Promise(resolve=>setTimeout(resolve,1800));results.webRTCTransportRequests={udp:packets-priorPackets,tcp:connections};assert.equal(connections,0);assert.equal(packets-priorPackets,0);await preview.webContents.executeJavaScript('globalThis.__qaPeer?.close();true');tcp.close();tcp=null;udp.close();udp=null;
  await capture(preview,path.join(folder,'preview-adversarial.png'));
  assert.equal(results.previewAPIs.process,'undefined');assert.equal(results.previewAPIs.require,'undefined');assert.equal(results.previewAPIs.bridge,'undefined');
  const disposed=await invoke('ide:stop');assert.equal(disposed.ok,true);
  await workbench.save({...await workbench.read('plugin.ts'),text:original.text.replace('start(context) {','start(context) { while(true){};')});
  const opening=invoke('ide:preview').then(value=>({value}),error=>({error:error.message}));for(let n=0;n<100&&(!preview||preview.isDestroyed());n++){await new Promise(resolve=>setTimeout(resolve,50));if(n===99)throw Error('Busy preview did not launch');}
  await new Promise(resolve=>setTimeout(resolve,700));const captured=preview,began=Date.now();const stopped=await invoke('ide:stop');results.busyPreview={elapsedMs:Date.now()-began,stopped,destroyed:captured.isDestroyed()};assert.ok(captured.isDestroyed());assert.ok(results.busyPreview.elapsedMs<1800);
  results.previewActionSettled=await Promise.race([opening,new Promise(resolve=>setTimeout(()=>resolve('STILL_PENDING'),1000))]);
  assert.notEqual(results.previewActionSettled,'STILL_PENDING');await invoke('ide:save',{...await workbench.read('plugin.ts'),text:original.text});assert.equal((await invoke('ide:preview')).ok,true);results.recoveredPreview=true;await invoke('ide:stop');
  results.ok=true;await report();await new Promise(resolve=>server.close(resolve));app.exit(0);
 }catch(error){results.error=error.stack;await report();server?.close();tcp?.close();udp?.close();rogue?.destroy();app.exit(1);}
}
`;
const entry=path.join(output,'instrumented-main.mjs');await fs.writeFile(entry,source);
const child=spawn(path.join(repo,'desktop/node_modules/electron/dist/electron.exe'),[entry,'--smoke'],{windowsHide:true,env:{...process.env,DSI_SMOKE_OUTPUT:output},stdio:'inherit'});
const timer=setTimeout(()=>child.kill(),60000);child.on('exit',async code=>{clearTimeout(timer);console.log('Red-team evidence: '+output);try{console.log(await fs.readFile(path.join(output,'result.json'),'utf8'));}catch{}process.exitCode=code===0?0:1;});
