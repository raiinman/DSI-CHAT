// Original DSI official-web integration; no remote preload or private Discord APIs.
export const DISCORD_ORIGIN='https://discord.com';
export function officialURL(value){try{const url=new URL(value);return url.origin===DISCORD_ORIGIN&&!url.username&&!url.password;}catch{return false;}}
export function externalHTTPS(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
// Preserve the runtime's Chromium/OS identity; don't impersonate Discord's native client.
export function chromiumUserAgent(value){return value.replace(/\s(?:Electron|dsi-chat-desktop)\/[^\s]+/g,'');}
export function configureDiscordHost({window,session,dialog,Menu,shell,onReady=()=>{},onState=()=>{}}){
 const contents=window.webContents;
 contents.setUserAgent(chromiumUserAgent(contents.getUserAgent()));
 let closed=false,prompting=false,externalPending=false,mediaGrants=new Set(),documentGeneration=0,navigationFailed=false;
 const capabilities={displayPlugins:'Reviewed original plugins on channels pages',microphoneCamera:'Native approval per request; OS/device availability applies',screenSharing:'Unavailable: capture approval cannot be safely bound to a chosen source on this host',externalLinks:'HTTPS only, confirmed in the system browser',unsupported:['Screen and system-audio capture','Desktop notifications','Native Discord integration','Private runtime plugins','Global shortcuts/game overlay','Guaranteed full Discord feature parity']};
 let state={phase:'loading',page:'app',capabilities,liveAccountVerified:false};
 const update=patch=>{state={...state,...patch};onState(snapshot());};
 const snapshot=()=>structuredClone(state);
 const trusted=(candidate,url,main)=>!closed&&!window.isDestroyed()&&candidate===contents&&main===true&&officialURL(contents.getURL())&&officialURL(url);
 const frameTrusted=frame=>!!frame&&!closed&&!window.isDestroyed()&&frame===contents.mainFrame&&officialURL(frame.url)&&officialURL(contents.getURL());
 session.setPermissionCheckHandler((candidate,permission,origin,details={})=>{
  if(!trusted(candidate,details.requestingUrl||origin,details.isMainFrame)||!officialURL(origin)||(details.securityOrigin&&!officialURL(details.securityOrigin)))return false;
  return permission==='media'&&['audio','video'].includes(details.mediaType)&&mediaGrants.has(details.mediaType);
 });
 session.setPermissionRequestHandler((candidate,permission,callback,details={})=>{
  let replied=false;const reply=value=>{if(!replied){replied=true;callback(value);}};
  if(!trusted(candidate,details.requestingUrl,details.isMainFrame)||(details.securityOrigin&&!officialURL(details.securityOrigin)))return reply(false);
  // Electron44 conflates legacy direct desktop capture and getDisplayMedia here.
  // A blanket grant would let the legacy path bypass any source chooser.
  if(permission==='display-capture'||(permission==='media'&&Array.isArray(details.mediaTypes)&&details.mediaTypes.length===0)){update({permission:'Screen sharing is unavailable on this host'});return reply(false);}
  const types=details.mediaTypes;
  if(permission!=='media'||!Array.isArray(types)||!types.length||types.some(type=>!['audio','video'].includes(type))||prompting)return reply(false);
  const generation=documentGeneration;
  prompting=true;update({permission:'Awaiting microphone/camera approval'});
  dialog.showMessageBox(window,{type:'question',title:'Discord device access',message:'Allow Discord web to use '+types.map(type=>type==='audio'?'your microphone':'your camera').join(' and ')+'?',detail:'Only the official Discord main page receives this permission. No recording is started by DSI.',buttons:['Deny','Allow'],defaultId:0,cancelId:0,noLink:true}).then(result=>{
   const allowed=result.response===1&&generation===documentGeneration&&trusted(candidate,details.requestingUrl,details.isMainFrame);
   if(allowed)for(const type of types)mediaGrants.add(type);
   reply(allowed);update({permission:allowed?'Device access approved':'Device access denied'});
  }).catch(()=>reply(false)).finally(()=>{prompting=false;});
 });
 session.setDisplayMediaRequestHandler((_request,callback)=>callback(null),{useSystemPicker:false});
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
 contents.on('did-start-navigation',(_event,_url,inPlace,main)=>{if(main&&!inPlace){documentGeneration++;navigationFailed=false;mediaGrants=new Set();update({phase:'loading',permission:null});}});
 const ready=()=>{if(navigationFailed||!frameTrusted(contents.mainFrame))return;const page=new URL(contents.getURL()).pathname.startsWith('/channels/')?'channels':'app-or-login';update({phase:'ready',page,errorCode:null});Promise.resolve().then(()=>onReady(window)).catch(()=>update({adapter:'Display adapter unavailable; reload or use safe mode'}));};
 contents.on('did-finish-load',ready);contents.on('did-navigate-in-page',(_event,_url,main)=>{if(main)ready();});
 contents.on('did-fail-load',(_event,code,_description,_url,main)=>{if(main&&code!==-3){navigationFailed=true;update({phase:'load-error',errorCode:code});}});
 contents.on('render-process-gone',(_event,details)=>update({phase:'renderer-stopped',reason:details.reason}));
 window.once('closed',()=>{closed=true;mediaGrants.clear();update({phase:'closed'});});
 const load=async()=>{if(closed||window.isDestroyed())return;mediaGrants.clear();update({phase:'loading'});try{await contents.loadURL('https://discord.com/app');}catch{navigationFailed=true;update({phase:'load-error'});}};
 return {snapshot,reload:load,load};
}
