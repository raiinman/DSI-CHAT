import {app,BrowserWindow,session} from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {configureDiscordHost,officialURL,externalHTTPS,chromiumUserAgent} from './discord-host.mjs';
const folder=process.env.DSI_HOST_QA_OUTPUT;app.setName('dsi-chat-desktop');app.setPath('userData',path.join(folder,'profile'));app.disableHardwareAcceleration();app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.whenReady().then(async()=>{
const results={controlledOriginFixture:true,fakeMediaDevices:true,electron:process.versions.electron};let window,rogue;
try{
 const isolated=session.fromPartition('dsi-host-qa-'+Date.now());
 const html='<!doctype html><meta charset="utf-8"><title>DSI controlled host QA</title><style>body{font:20px sans-serif;background:#182521;color:#f7edcf;padding:32px}button{font-size:20px}iframe{width:300px;height:100px}</style><h1>Official-origin integration fixture</h1><p>Original controlled test content. No Discord account or messages.</p><button id="capture">Controlled capture</button><iframe src="https://discord.com/qa-child"></iframe>';
 let failLoad=false,requestUserAgent;await isolated.protocol.handle('https',request=>{requestUserAgent=request.headers.get('user-agent');return failLoad?Response.error():new Response(html,{headers:{'content-type':'text/html'}});});
 window=new BrowserWindow({show:true,width:1000,height:700,title:'DSI controlled host QA',webPreferences:{session:isolated,nodeIntegration:false,contextIsolation:true,sandbox:true}});
 const originalUserAgent=window.webContents.getUserAgent(),defaultSessionAgent=isolated.getUserAgent();
 let requestHandler,checkHandler,displayHandler;const hooked={setPermissionRequestHandler:handler=>{requestHandler=handler;isolated.setPermissionRequestHandler(handler);},setPermissionCheckHandler:handler=>{checkHandler=handler;isolated.setPermissionCheckHandler(handler);},setDisplayMediaRequestHandler:(handler,options)=>{displayHandler=handler;isolated.setDisplayMediaRequestHandler(handler,options);}};
 let response=0,promptCount=0,deferredApproval;const external=[];
 const dialogs={showMessageBox:async(_window,options)=>{promptCount++;assert.equal(options.defaultId,0);if(deferredApproval)return deferredApproval;return {response};}};
 const menu={buildFromTemplate:()=>({popup:()=>{}})};
 const host=configureDiscordHost({window,session:hooked,dialog:dialogs,Menu:menu,shell:{openExternal:async url=>external.push(url)}});
 await host.load();window.show();await new Promise(resolve=>setTimeout(resolve,500));assert.equal(host.snapshot().phase,'ready');assert.equal(host.snapshot().page,'app-or-login');
 const execute=code=>window.webContents.executeJavaScript(code,true);
 const normalizedAgent=await execute('navigator.userAgent');assert.equal(normalizedAgent,chromiumUserAgent(originalUserAgent));assert.ok(!/Electron\/|dsi-chat-desktop\//.test(normalizedAgent));assert.equal(requestUserAgent,normalizedAgent);assert.equal(isolated.getUserAgent(),defaultSessionAgent);assert.equal(normalizedAgent.match(/Chrome\/[^\s]+/)[0],originalUserAgent.match(/Chrome\/[^\s]+/)[0]);assert.equal(normalizedAgent.match(/\([^)]*\)/)[0],originalUserAgent.match(/\([^)]*\)/)[0]);
 assert.ok(originalUserAgent.includes('Electron/'));assert.ok(originalUserAgent.includes('dsi-chat-desktop/'));results.browserIdentity={normalized:true,originalElectronAndDSIBrandsPresent:true,httpAndNavigatorMatch:true,chromiumVersion:process.versions.chrome,sessionDefaultUnchanged:true};
 await execute('localStorage.setItem("controlled-host-state","QA_STORAGE_SENTINEL")');
 const media='navigator.mediaDevices.getUserMedia({audio:true,video:true}).then(stream=>{const kinds=stream.getTracks().map(track=>track.kind);stream.getTracks().forEach(track=>track.stop());return kinds;},error=>error.name)';
 results.deniedMedia=await execute(media);assert.equal(results.deniedMedia,'NotAllowedError');response=1;
 results.approvedMedia=await execute(media);assert.deepEqual(results.approvedMedia.sort(),['audio','video']);assert.ok(promptCount>=2);
 let videoFailure;const videoTransmission=execute(`(async()=>{
  const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
  const outgoing=new RTCPeerConnection({iceServers:[]}),incoming=new RTCPeerConnection({iceServers:[]});
  const video=document.createElement('video');video.muted=true;video.autoplay=true;video.style.width='320px';document.body.append(video);
  const queued=new Map([[outgoing,[]],[incoming,[]]]),forward=(peer,event)=>{if(event.candidate){if(peer.remoteDescription)peer.addIceCandidate(event.candidate).catch(()=>{});else queued.get(peer).push(event.candidate);}};
  outgoing.onicecandidate=event=>forward(incoming,event);incoming.onicecandidate=event=>forward(outgoing,event);
  const flush=peer=>Promise.all(queued.get(peer).splice(0).map(candidate=>peer.addIceCandidate(candidate)));
  incoming.ontrack=event=>{video.srcObject=new MediaStream([event.track]);};
  try{
   outgoing.addTrack(stream.getVideoTracks()[0],stream);await outgoing.setLocalDescription(await outgoing.createOffer());await incoming.setRemoteDescription(outgoing.localDescription);await flush(incoming);await incoming.setLocalDescription(await incoming.createAnswer());await outgoing.setRemoteDescription(incoming.localDescription);await flush(outgoing);
   for(let attempt=0;attempt<100;attempt++){await new Promise(resolve=>setTimeout(resolve,50));const stats=await incoming.getStats();const received=[...stats.values()].find(stat=>stat.type==='inbound-rtp'&&stat.kind==='video'&&stat.framesDecoded>0);if(received&&video.videoWidth>0&&video.videoHeight>0){const result={receivedFrames:received.framesDecoded,width:video.videoWidth,height:video.videoHeight,connected:incoming.connectionState==='connected'};globalThis.__qaVideoRendered=true;await new Promise(resolve=>{globalThis.__qaReleaseVideo=resolve;});return result;}}
   throw Error('Owned WebRTC video loopback did not decode frames');
  }finally{stream.getTracks().forEach(track=>track.stop());outgoing.close();incoming.close();video.remove();}
 })()`).catch(error=>{videoFailure=error;});
 for(let attempt=0;attempt<120;attempt++){if(videoFailure)throw videoFailure;if(await execute('globalThis.__qaVideoRendered===true'))break;if(attempt===119)throw Error('Owned video fixture did not render');await new Promise(resolve=>setTimeout(resolve,50));}
 await new Promise(resolve=>setTimeout(resolve,150));await fs.writeFile(path.join(folder,'fake-video.png'),(await window.webContents.capturePage()).toPNG());await execute('globalThis.__qaReleaseVideo();delete globalThis.__qaVideoRendered;delete globalThis.__qaReleaseVideo;true');
 results.localWebRTCVideo=await videoTransmission;assert.ok(results.localWebRTCVideo.receivedFrames>0);assert.ok(results.localWebRTCVideo.width>0&&results.localWebRTCVideo.height>0);assert.equal(results.localWebRTCVideo.connected,true);
 const details={isMainFrame:true,requestingUrl:'https://discord.com/channels/@me',securityOrigin:'https://discord.com',mediaTypes:['audio']};
 const permit=(candidate,permission,detail)=>new Promise(resolve=>requestHandler(candidate,permission,resolve,detail));
 assert.equal(await permit(window.webContents,'media',{...details,isMainFrame:false}),false);
 assert.equal(await permit(window.webContents,'media',{...details,requestingUrl:'https://discord.com.evil.invalid/'}),false);
 assert.equal(await permit(window.webContents,'media',{...details,securityOrigin:'https://evil.invalid'}),false);
 assert.equal(await permit(window.webContents,'notifications',details),false);
 rogue=new BrowserWindow({show:false,webPreferences:{session:isolated,nodeIntegration:false,contextIsolation:true,sandbox:true}});assert.equal(rogue.webContents.getUserAgent(),originalUserAgent);await rogue.loadURL('https://discord.com/app');assert.equal(await permit(rogue.webContents,'media',details),false);rogue.destroy();rogue=null;results.otherWindowIdentityUnchanged=true;
 assert.equal(checkHandler(window.webContents,'media','https://discord.com',{...details,mediaType:'audio'}),true);assert.equal(checkHandler(window.webContents,'media','https://evil.invalid',{...details,mediaType:'audio'}),false);
 const child=window.webContents.mainFrame.frames[0];assert.ok(child);assert.equal(await child.executeJavaScript(media),'NotAllowedError');results.actualSubframeMediaDenied=true;
 results.scopedPermissionGuards=true;
 const beforeSpoof=promptCount;await window.webContents.loadURL('https://discord.com.evil.invalid/app');assert.equal(await execute(media),'NotAllowedError');assert.equal(promptCount,beforeSpoof);await host.reload();results.actualLookalikeOriginDenied=true;
 const display='navigator.mediaDevices.getDisplayMedia({video:true,audio:false}).then(stream=>{const kinds=stream.getTracks().map(track=>track.kind);stream.getTracks().forEach(track=>track.stop());return kinds;},error=>error.name)';
 results.cancelledCapture=await execute(display);assert.ok(['NotAllowedError','AbortError'].includes(results.cancelledCapture));
 results.legacyScreenCapture=await execute('navigator.mediaDevices.getUserMedia({audio:false,video:{mandatory:{chromeMediaSource:"desktop",chromeMediaSourceId:'+JSON.stringify(window.getMediaSourceId())+'}}}).then(stream=>{stream.getTracks().forEach(track=>track.stop());return "CAPTURED_WITHOUT_CHOOSER";},error=>error.name)');
 assert.notEqual(results.legacyScreenCapture,'CAPTURED_WITHOUT_CHOOSER');
 assert.equal(results.legacyScreenCapture,'NotAllowedError');assert.equal(results.cancelledCapture,'NotAllowedError');results.screenCaptureBlocked=true;
 response=0;await execute('window.open("https://example.invalid/approved-only")');await new Promise(resolve=>setTimeout(resolve,100));assert.deepEqual(external,[]);
 response=1;await execute('window.open("https://example.invalid/approved-only")');await new Promise(resolve=>setTimeout(resolve,100));assert.deepEqual(external,['https://example.invalid/approved-only']);
 let releaseLink;deferredApproval=new Promise(resolve=>{releaseLink=resolve;});await execute('window.open("https://example.invalid/stale-link")');await host.reload();releaseLink({response:1});await new Promise(resolve=>setTimeout(resolve,50));deferredApproval=null;assert.deepEqual(external,['https://example.invalid/approved-only']);results.pendingExternalApprovalRevokedByReload=true;
 for(const target of ['file:///C:/never-open','javascript:alert(1)','https://user:password@example.invalid/','http://example.invalid/'])assert.equal(externalHTTPS(target),null);assert.equal(officialURL('https://discord.com.evil.invalid/app'),false);results.externalApprovalAndProtocolGuards=true;
 await execute('history.pushState({},"","/channels/@me")');await new Promise(resolve=>setTimeout(resolve,100));assert.equal(host.snapshot().page,'channels');await host.reload();assert.equal(host.snapshot().phase,'ready');assert.equal(host.snapshot().page,'app-or-login');results.reloadAndRouteState=true;
 const beforeReloadRequest=promptCount;assert.deepEqual((await execute(media)).sort(),['audio','video']);assert.ok(promptCount>beforeReloadRequest);results.reloadRequiresNewApproval=true;
 assert.equal(await execute('navigator.userAgent'),normalizedAgent);assert.equal(requestUserAgent,normalizedAgent);results.browserIdentity.reloadRetained=true;
 let release;deferredApproval=new Promise(resolve=>{release=resolve;});const waitingApproval=permit(window.webContents,'media',details);await host.reload();release({response:1});assert.equal(await waitingApproval,false);deferredApproval=null;results.pendingApprovalRevokedByReload=true;
 assert.equal(await execute('localStorage.getItem("controlled-host-state")'),'QA_STORAGE_SENTINEL');assert.ok(!JSON.stringify(host.snapshot()).includes('QA_STORAGE_SENTINEL'));results.ownedWebStorageRetainedWithoutInspection=true;
 failLoad=true;await host.reload().catch(()=>{});assert.equal(host.snapshot().phase,'load-error');failLoad=false;await host.reload();assert.equal(host.snapshot().phase,'ready');results.realLoadFailureAndRetry=true;
 results.isolation=await execute('({node:typeof process,bridge:typeof dsiDesktop,discordNative:typeof DiscordNative})');assert.deepEqual(results.isolation,{node:'undefined',bridge:'undefined',discordNative:'undefined'});
 await new Promise(resolve=>setTimeout(resolve,250));await fs.writeFile(path.join(folder,'host.png'),(await window.webContents.capturePage()).toPNG());window.destroy();assert.equal(host.snapshot().phase,'closed');results.ok=true;
}catch(error){results.error=error.stack;if(window&&!window.isDestroyed())await window.webContents.capturePage().then(image=>fs.writeFile(path.join(folder,'failure.png'),image.toPNG())).catch(()=>{});}
finally{await fs.writeFile(path.join(folder,'result.json'),JSON.stringify(results,null,2));rogue?.destroy();app.exit(results.ok?0:1);}
});
