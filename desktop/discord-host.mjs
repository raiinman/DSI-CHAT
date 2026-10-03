import {CAPTURE_GUARD_SOURCE,CAPTURE_GUARD_VERIFY_EXPRESSION,CAPTURE_GUARD_SOURCE_URL} from './capture-guard.mjs';
// Original DSI official-web integration; no remote preload or private Discord APIs.
import {PERMISSIONS,officialURL,approvedExternalHTTPS} from '../security/policy.mjs';
export {officialURL};
export const DISCORD_ORIGIN=PERMISSIONS.discord.origin;
export const externalHTTPS=approvedExternalHTTPS;
// Preserve the runtime's Chromium/OS identity; don't impersonate Discord's native client.
export function chromiumUserAgent(value){return value.replace(/\s(?:Electron|dsi-chat-desktop)\/[^\s]+/g,'');}
export function configureDiscordHost({window,session,dialog,Menu,shell,onReady=()=>{},onState=()=>{},picker}){
 const contents=window.webContents;
 contents.setUserAgent(chromiumUserAgent(contents.getUserAgent()));
 let closed=false,prompting=false,externalPending=false,mediaGrants=new Set(),documentGeneration=0,navigationFailed=false;
 const captureEnabled=!!picker&&PERMISSIONS.discord.screenSharing==='guarded-modern-picker';
 let guardInstalled=false,guardHealthy=false;
 const failGuard=()=>{guardHealthy=false;picker?.cancel();if(!closed&&!window.isDestroyed()){update({phase:'capture-guard-failed',permission:'Capture guard lost; reopen Discord to continue safely'});window.destroy();}};
 if(captureEnabled){contents.debugger.on('detach',failGuard);contents.debugger.on('message',(_event,method,params)=>{if(method==='Runtime.exceptionThrown'&&(params.exceptionDetails?.url===CAPTURE_GUARD_SOURCE_URL||params.exceptionDetails?.stackTrace?.callFrames?.some(frame=>frame.url===CAPTURE_GUARD_SOURCE_URL)))failGuard();});}
 const capabilities={displayPlugins:'Reviewed original plugins on channels pages',microphoneCamera:'Native approval per request; OS/device availability applies',screenSharing:captureEnabled?'Explicit Copperlight source picker; guarded modern API, live Discord retest pending':'Screen sharing disabled by policy or unavailable guard',externalLinks:'HTTPS only, confirmed in the system browser',unsupported:[...(captureEnabled?[]:['Screen and system-audio capture']),'Desktop notifications','Native Discord integration','Private runtime plugins','Global shortcuts/game overlay','Guaranteed full Discord feature parity']};
 let state={phase:'loading',page:'app',capabilities,liveAccountVerified:false};
 const update=patch=>{state={...state,...patch};onState(snapshot());};
 const snapshot=()=>structuredClone(state);
 const trusted=(candidate,url,main)=>!closed&&!window.isDestroyed()&&candidate===contents&&main===true&&officialURL(contents.getURL())&&officialURL(url);
 const frameTrusted=frame=>!!frame&&!closed&&!window.isDestroyed()&&frame===contents.mainFrame&&officialURL(frame.url)&&officialURL(contents.getURL());
 session.setPermissionCheckHandler((candidate,permission,origin,details={})=>{
  if(!trusted(candidate,details.requestingUrl||origin,details.isMainFrame)||!officialURL(origin)||(details.securityOrigin&&!officialURL(details.securityOrigin)))return false;
  if(permission==='display-capture')return captureEnabled&&guardInstalled&&guardHealthy&&contents.debugger.isAttached();
  return permission==='media'&&PERMISSIONS.discord.deviceMediaTypes.includes(details.mediaType)&&mediaGrants.has(details.mediaType);
 });
 session.setPermissionRequestHandler((candidate,permission,callback,details={})=>{
  let replied=false;const reply=value=>{if(!replied){replied=true;callback(value);}};
  if(!trusted(candidate,details.requestingUrl,details.isMainFrame)||(details.securityOrigin&&!officialURL(details.securityOrigin)))return reply(false);
  // Electron44 shares empty-media permission between capture APIs; the early guard blocks legacy access.
  if(permission==='display-capture'||(permission==='media'&&Array.isArray(details.mediaTypes)&&details.mediaTypes.length===0)){return reply(captureEnabled&&guardInstalled&&guardHealthy&&contents.debugger.isAttached());}
  const types=details.mediaTypes;
  if(permission!=='media'||!Array.isArray(types)||!types.length||types.some(type=>!PERMISSIONS.discord.deviceMediaTypes.includes(type))||prompting)return reply(false);
  const generation=documentGeneration;
  prompting=true;update({permission:'Awaiting microphone/camera approval'});
  dialog.showMessageBox(window,{type:'question',title:'Discord device access',message:'Allow Discord web to use '+types.map(type=>type==='audio'?'your microphone':'your camera').join(' and ')+'?',detail:'Only the official Discord main page receives this permission. No recording is started by DSI.',buttons:['Deny','Allow'],defaultId:0,cancelId:0,noLink:true}).then(result=>{
   const allowed=result.response===1&&generation===documentGeneration&&trusted(candidate,details.requestingUrl,details.isMainFrame);
   if(allowed)for(const type of types)mediaGrants.add(type);
   reply(allowed);update({permission:allowed?'Device access approved':'Device access denied'});
  }).catch(()=>reply(false)).finally(()=>{prompting=false;});
 });
 session.setDisplayMediaRequestHandler((request,callback)=>{
  const generation=documentGeneration;
  const current=()=>captureEnabled&&guardInstalled&&guardHealthy&&contents.debugger.isAttached()&&generation===documentGeneration&&frameTrusted(request.frame)&&officialURL(request.securityOrigin);
  if(!current())return callback(null);
  void picker.request(request,callback,current);
 },{useSystemPicker:false});
 const external=async value=>{
  const safe=externalHTTPS(value);if(!safe||externalPending||!frameTrusted(contents.mainFrame))return;
  externalPending=true;const generation=documentGeneration;
  try{const result=await dialog.showMessageBox(window,{type:'question',title:'Open external link',message:'Open '+new URL(safe).hostname+' in your default browser?',detail:'The link leaves the isolated Discord window. Only proceed if you trust its destination.',buttons:['Cancel','Open browser'],defaultId:0,cancelId:0,noLink:true});if(result.response===1&&generation===documentGeneration&&frameTrusted(contents.mainFrame))await shell.openExternal(safe);}
  catch{update({externalLink:'The external browser could not be opened'});}finally{externalPending=false;}
 };
 contents.setWindowOpenHandler(details=>{if(!details.postBody)void external(details.url);return {action:'deny'};});
 contents.on('will-navigate',(event,url)=>{if(!officialURL(url)){event.preventDefault();void external(url);}});
 contents.on('will-redirect',(event,url)=>{if(!officialURL(url)){event.preventDefault();update({phase:'blocked-navigation'});}});
 contents.on('will-attach-webview',event=>event.preventDefault());
 contents.on('context-menu',(_event,params)=>{if(!frameTrusted(contents.mainFrame)||!officialURL(params.frameURL)||!externalHTTPS(params.linkURL))return;Menu.buildFromTemplate([{label:'Open link in default browser…',click:()=>external(params.linkURL)}]).popup({window});});
 contents.on('did-start-navigation',(_event,_url,inPlace,main)=>{if(main&&!inPlace){documentGeneration++;guardHealthy=false;picker?.cancel();navigationFailed=false;mediaGrants=new Set();update({phase:'loading',permission:null});}});
 const ready=async()=>{if(navigationFailed||!frameTrusted(contents.mainFrame))return;const generation=documentGeneration;
  if(captureEnabled){try{if(!guardInstalled||!contents.debugger.isAttached())throw Error('Guard unavailable');const verified=await contents.debugger.sendCommand('Runtime.evaluate',{expression:CAPTURE_GUARD_VERIFY_EXPRESSION,returnByValue:true});if(verified.result?.value!==true||verified.exceptionDetails)throw Error('Guard verification failed');if(generation!==documentGeneration)return;guardHealthy=true;}catch{if(generation===documentGeneration)failGuard();return;}}
 const page=new URL(contents.getURL()).pathname.startsWith('/channels/')?'channels':'app-or-login';update({phase:'ready',page,errorCode:null});Promise.resolve().then(()=>onReady(window)).catch(()=>update({adapter:'Display adapter unavailable; reload or use safe mode'}));};
 contents.on('did-navigate',(_event,url)=>{if(captureEnabled&&guardInstalled&&!officialURL(url))failGuard();});
 contents.on('did-stop-loading',()=>{if(state.phase==='loading')void ready();});
 contents.on('did-finish-load',ready);contents.on('did-navigate-in-page',(_event,_url,main)=>{if(main)ready();});
 contents.on('did-fail-load',(_event,code,_description,_url,main)=>{if(main&&code!==-3){navigationFailed=true;update({phase:'load-error',errorCode:code});}});
 contents.on('render-process-gone',(_event,details)=>{guardHealthy=false;picker?.cancel();update({phase:'renderer-stopped',reason:details.reason});if(captureEnabled)failGuard();});
 window.once('closed',()=>{closed=true;guardHealthy=false;picker?.dispose();mediaGrants.clear();update({phase:'closed'});});
 const load=async()=>{if(closed||window.isDestroyed())return;mediaGrants.clear();update({phase:'loading'});try{if(captureEnabled&&!guardInstalled){await contents.loadURL('about:blank');contents.debugger.attach('1.3');await contents.debugger.sendCommand('Page.enable');await contents.debugger.sendCommand('Runtime.enable');const registration=await contents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:CAPTURE_GUARD_SOURCE,runImmediately:true});if(!registration.identifier)throw Error('Guard registration unavailable');guardInstalled=true;}await contents.loadURL(DISCORD_ORIGIN+'/app');}catch{navigationFailed=true;update({phase:'load-error'});if(captureEnabled&&!guardInstalled)failGuard();}};
 return {snapshot,reload:load,load};
}
