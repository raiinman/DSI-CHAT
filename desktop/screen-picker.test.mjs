import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {createScreenPicker} from './screen-picker.mjs';

function fixture({sources,error,timeoutMs=1000}={}){
 const directory=path.dirname(fileURLToPath(import.meta.url)),handlers=new Map(),windows=[];
 const parent=new EventEmitter();parent.isDestroyed=()=>false;
 class Window extends EventEmitter{
  constructor(options){super();this.options=options;this.destroyed=false;this.webContents=new EventEmitter();this.webContents.mainFrame={url:pathToFileURL(path.join(directory,'picker.html')).href};this.webContents.setWindowOpenHandler=()=>{};windows.push(this);}
  isDestroyed(){return this.destroyed;}async loadFile(){}show(){this.shown=true;}close(){this.destroyed=true;this.emit('closed');}
 }
 const values=sources??[{id:'window:owned:0',name:'<img src=x onerror=attack()>',thumbnail:{toDataURL:()=> 'data:image/png;base64,AA=='}}];
 const controller=createScreenPicker({parent,directory,BrowserWindow:Window,timeoutMs,ipcMain:{handle:(name,handler)=>handlers.set(name,handler),removeHandler:name=>handlers.delete(name)},desktopCapturer:{getSources:async()=>{if(error)throw Error('PRIVATE_SOURCE_FAILURE');return values;}}});
 const event=()=>({sender:windows.at(-1).webContents,senderFrame:windows.at(-1).webContents.mainFrame});
 const invoke=(name,...args)=>handlers.get('dsi:picker-'+name)(event(),...args);
 return {controller,handlers,windows,event,invoke,parent};
}

test('picker binds opaque selections to its exact renderer and resolves only once',async()=>{
 const f=fixture(),replies=[];await f.controller.request({videoRequested:true,audioRequested:false,userGesture:true},value=>replies.push(value),()=>true);
 const state=f.invoke('state');assert.equal(state.sources.length,1);assert.notEqual(state.sources[0].key,'window:owned:0');
 assert.throws(()=>f.handlers.get('dsi:picker-select')({sender:{},senderFrame:f.event().senderFrame},{requestId:state.requestId,key:state.sources[0].key,audio:false}),/Untrusted/);
 assert.throws(()=>f.handlers.get('dsi:picker-cancel')({sender:f.event().sender,senderFrame:{url:f.event().senderFrame.url}}),/Untrusted/);
 assert.throws(()=>f.invoke('select',{requestId:'stale',key:state.sources[0].key,audio:false}),/Invalid/);
 assert.throws(()=>f.invoke('select',{requestId:state.requestId,key:'window:outside:0',audio:false}),/expired/);
 f.invoke('select',{requestId:state.requestId,key:state.sources[0].key,audio:true});assert.equal(replies.length,1);assert.equal(replies[0].video.id,'window:owned:0');assert.equal(replies[0].audio,undefined);
 f.controller.cancel();f.controller.dispose();assert.equal(replies.length,1);assert.equal(f.handlers.size,0);
});

test('concurrent requests, closing, stale documents and missing gestures cancel',async()=>{
 const f=fixture(),replies=[];let current=true;
 await f.controller.request({videoRequested:true,userGesture:true},value=>replies.push(value),()=>current);
 await f.controller.request({videoRequested:true,userGesture:true},value=>replies.push(value),()=>true);assert.deepEqual(replies,[null]);
 current=false;assert.throws(()=>f.invoke('cancel'),/Untrusted/);f.controller.cancel();assert.deepEqual(replies,[null,null]);
 await f.controller.request({videoRequested:true,userGesture:false},value=>replies.push(value),()=>true);assert.equal(f.windows.length,1);
 await f.controller.request({videoRequested:true,userGesture:true},value=>replies.push(value),()=>true);f.windows.at(-1).close();assert.equal(replies.at(-1),null);f.controller.dispose();
});

test('refresh invalidates old source keys and errors/timeout settle pending callbacks',async()=>{
 const f=fixture(),replies=[];await f.controller.request({videoRequested:true,userGesture:true},value=>replies.push(value),()=>true);
 const old=f.invoke('state'),fresh=await f.invoke('refresh');assert.notEqual(old.sources[0].key,fresh.sources[0].key);
 assert.throws(()=>f.invoke('select',{requestId:old.requestId,key:old.sources[0].key,audio:false}),/expired/);f.controller.dispose();assert.deepEqual(replies,[null]);
 const fail=fixture({error:true}),errors=[];await fail.controller.request({videoRequested:true,userGesture:true},value=>errors.push(value),()=>true);assert.deepEqual(errors,[null]);fail.controller.dispose();
 const timed=fixture({timeoutMs:10}),timeouts=[];await timed.controller.request({videoRequested:true,userGesture:true},value=>timeouts.push(value),()=>true);await new Promise(resolve=>setTimeout(resolve,20));assert.deepEqual(timeouts,[null]);timed.controller.dispose();
});
