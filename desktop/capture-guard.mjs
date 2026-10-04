// Original DSI public-media compatibility guard; no permissions or native privilege are granted here.
function installCaptureGuard(){
 const define=Object.defineProperty,descriptor=Object.getOwnPropertyDescriptor,create=Object.create,freeze=Object.freeze,setPrototype=Object.setPrototypeOf,keys=Reflect.ownKeys,apply=Reflect.apply,isArray=Array.isArray,iterator=Symbol.iterator,NativePromise=Promise,reject=Promise.reject,then=Promise.prototype.then,Exception=DOMException;
 const devices=navigator.mediaDevices;if(!devices)return;
 const proto=Object.getPrototypeOf(devices),native=proto.getUserMedia;
 const navigatorProto=Object.getPrototypeOf(navigator);
 function denial(){return new Exception('Legacy display capture is blocked; use the chosen-source screen picker.','NotAllowedError');}
 function snapshot(value,depth=0,budget={remaining:1000}){
  if(--budget.remaining<0||depth>12)throw denial();
  const type=typeof value;if(value===null||type==='undefined'||type==='boolean'||type==='string'||type==='number')return value;
  if(typeof value!=='object')throw denial();
  if(isArray(value)){const result=setPrototype([],null),length=value.length;if(length>100)throw denial();for(let n=0;n<length;n++)result[n]=snapshot(value[n],depth+1,budget);define(result,iterator,{value:function(){let index=0;return {next(){return index<length?{value:result[index++],done:false}:{done:true};}};},writable:false,configurable:false});return freeze(result);}
  const result=create(null),names=setPrototype([],null);
  // Include enumerable inherited values; every value is read exactly once into plain data.
  for(const name in value)names[names.length]=name;
  const own=keys(value);for(let n=0;n<own.length;n++){const name=own[n];if(typeof name!=='string')throw denial();let found=false;for(let i=0;i<names.length;i++)if(names[i]===name)found=true;if(!found)names[names.length]=name;}
  for(let n=0;n<names.length;n++){const name=names[n];if(name==='__proto__'||name==='constructor'||name==='prototype'||name==='chromeMediaSource'||name==='chromeMediaSourceId'||name==='chromeMediaSourceDeviceId'||name==='mandatory'||name==='optional')throw denial();result[name]=snapshot(value[name],depth+1,budget);}
  return freeze(result);
 }
 function guarded(constraints){try{return apply(native,this,[snapshot(constraints)]);}catch(error){return apply(reject,NativePromise,[error]);}}
 define(proto,'getUserMedia',{value:guarded,writable:false,configurable:false});
 // Compatibility adapters may wrap the public entry point. The native method
 // remains private behind the immutable prototype guard; assignments expose no
 // unguarded native path. Keep accessor identity locked and independently verified.
 const bindings=[];
 function bind(target,name,initial){let current=initial;const get=()=>current,set=value=>{if(typeof value!=='function')throw new TypeError('Media adapter must be a function');current=value;};define(target,name,{get,set,configurable:false,enumerable:true});bindings[bindings.length]={target,name,get,set};}
 bind(devices,'getUserMedia',guarded);
 const aliases=[];
 for(const name of ['getUserMedia','webkitGetUserMedia','mozGetUserMedia']){
  if(typeof navigator[name]!=='function')continue;
  const callback=function(constraints,success,failure){const promise=apply(guarded,devices,[constraints]);apply(then,promise,[success,failure]);};
  define(navigatorProto,name,{value:callback,writable:false,configurable:false});bind(navigator,name,callback);
  aliases[aliases.length]={name,callback};
 }
 define(globalThis,'__dsiCaptureGuardV1',{value:1,writable:false,configurable:false});
 function locked(target,name,value){const property=descriptor(target,name);return !!property&&property.value===value&&property.writable===false&&property.configurable===false;}
 function verify(){if(!locked(globalThis,'__dsiCaptureGuardV1',1)||!locked(proto,'getUserMedia',guarded))return false;for(let n=0;n<bindings.length;n++){const {target,name,get,set}=bindings[n],p=descriptor(target,name);if(!p||p.get!==get||p.set!==set||p.configurable!==false)return false;}for(let n=0;n<aliases.length;n++){const {name,callback}=aliases[n];if(!locked(navigatorProto,name,callback))return false;}return locked(globalThis,'__dsiCaptureGuardVerifyV1',verify);}
 define(globalThis,'__dsiCaptureGuardVerifyV1',{value:verify,writable:false,configurable:false});
}
export const CAPTURE_GUARD_SOURCE='('+installCaptureGuard.toString()+')();\n//# sourceURL=dsi-capture-guard.js';

export const CAPTURE_GUARD_MARKER='__dsiCaptureGuardV1';
// The closure uses captured native descriptor access; page-poisoned Object methods cannot fake it.
export const CAPTURE_GUARD_VERIFY_EXPRESSION='globalThis.__dsiCaptureGuardVerifyV1?.()===true';
export const CAPTURE_GUARD_SOURCE_URL='dsi-capture-guard.js';

