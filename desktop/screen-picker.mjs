import {PERMISSIONS} from '../security/policy.mjs';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Source names/thumbnails stay in this local window and are never persisted.
export function createScreenPicker({parent,ipcMain,BrowserWindow,desktopCapturer,directory,timeoutMs=PERMISSIONS.picker.requestTimeoutMs}) {
 const channels=['dsi:picker-state','dsi:picker-select','dsi:picker-cancel','dsi:picker-refresh'];
 const page=pathToFileURL(path.join(directory,'picker.html')).href;
 let pending,disposed=false;
 const current=()=>!!pending&&!disposed&&!parent.isDestroyed()&&pending.isCurrent();
 const trusted=event=>current()&&pending.window&&!pending.window.isDestroyed()&&event.sender===pending.window.webContents&&event.senderFrame===pending.window.webContents.mainFrame&&event.senderFrame.url===page;
 const state=()=>({requestId:pending.id,loading:pending.loading,audioAvailable:pending.audioRequested&&PERMISSIONS.picker.systemAudio!=='deny'&&process.platform==='win32',sources:[...pending.sources].map(([key,source])=>({key,name:String(source.name).slice(0,200),kind:source.id.startsWith('screen:')?'screen':'window',thumbnail:source.thumbnail.toDataURL()}))});
 const settle=value=>{
  const operation=pending;if(!operation)return;
  pending=undefined;clearTimeout(operation.timer);operation.sources.clear();
  if(operation.window&&!operation.window.isDestroyed())operation.window.close();
  operation.callback(value);
 };
 const cancel=()=>settle(null);
 const enumerate=async()=>{
  const operation=pending;if(!current()||operation.loading)return;
  operation.loading=true;
  try{
   const sources=await desktopCapturer.getSources({types:[...PERMISSIONS.picker.sourceTypes],thumbnailSize:{width:300,height:180},fetchWindowIcons:false});
   if(pending!==operation||!current()){if(pending===operation)cancel();return;}
   operation.sources=new Map(sources.slice(0,PERMISSIONS.picker.maxSources).map(source=>[crypto.randomUUID(),source]));
  }catch{if(pending===operation)cancel();return;}
  finally{operation.loading=false;}
 };
 ipcMain.handle(channels[0],event=>{if(!trusted(event))throw Error('Untrusted screen picker sender');return state();});
 ipcMain.handle(channels[1],(event,value)=>{
  if(!trusted(event))throw Error('Untrusted screen picker sender');
  if(!value||value.requestId!==pending.id||typeof value.key!=='string'||typeof value.audio!=='boolean'||pending.loading)throw Error('Invalid screen selection');
  const source=pending.sources.get(value.key);if(!source)throw Error('Screen selection expired; refresh the list');
  const audio=value.audio&&pending.audioRequested&&PERMISSIONS.picker.systemAudio!=='deny'&&process.platform==='win32'&&source.id.startsWith('screen:');
  settle({video:{...source,name:'DSI selected source'},...(audio?{audio:'loopback'}:{})});return {ok:true};
 });
 ipcMain.handle(channels[2],event=>{if(!trusted(event))throw Error('Untrusted screen picker sender');cancel();return {ok:true};});
 ipcMain.handle(channels[3],async event=>{if(!trusted(event))throw Error('Untrusted screen picker sender');await enumerate();if(!trusted(event))throw Error('Screen request expired');return state();});
 const request=async(request,callback,isCurrent)=>{
  if(disposed||pending||parent.isDestroyed()||!isCurrent()||request.videoRequested!==true||request.userGesture!==true){callback(null);return;}
  pending={id:crypto.randomUUID(),callback,isCurrent,sources:new Map(),loading:false,audioRequested:request.audioRequested===true};
  const operation=pending;
  operation.timer=setTimeout(()=>{if(pending===operation)cancel();},timeoutMs);
  let window;try{window=new BrowserWindow({parent,modal:true,width:840,height:650,minWidth:580,minHeight:460,title:'DSI • Choose what to share',autoHideMenuBar:true,backgroundColor:'#ede1ce',show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(directory,'picker-preload.cjs')}});
  }catch{if(pending===operation)cancel();return;}
  operation.window=window;
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.webContents.on('render-process-gone',()=>{if(pending===operation)cancel();});
  window.once('closed',()=>{if(pending===operation)cancel();});
  try{
   await enumerate();if(pending!==operation||!current()){if(pending===operation)cancel();return;}
   await window.loadFile(path.join(directory,'picker.html'));
   if(pending===operation&&current())window.show();else if(pending===operation)cancel();
  }catch{if(pending===operation)cancel();}
 };
 const dispose=()=>{if(disposed)return;cancel();disposed=true;for(const channel of channels)ipcMain.removeHandler(channel);};
 parent.once('closed',dispose);
 return {request,cancel,dispose};
}
