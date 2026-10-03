import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginRuntime, validateManifest} from '../src/plugins/runtime.mjs';
import {BUILTIN_MANIFESTS} from '../src/plugins/builtins.mjs';
import {normalizePluginSettings} from '../src/plugins/settings.mjs';

test('hostile persisted records cannot pollute prototypes or inject CSS setting text',()=>{
 const attacks=[null,[],{},true,1,'18px; background:url(https://attacker.invalid/)',NaN,Infinity,-Infinity,1e300,-1,4096,{size:18},[18]];
 for(const size of attacks){
  const input=JSON.parse('{"version":2,"__proto__":{"dsiPoison":true},"constructor":{"prototype":{"dsiPoison":true}},"enabled":{"__proto__":true,"unknown":true,"larger-text":true},"plugins":{"larger-text":{}}}');
  input.plugins['larger-text'].size=size;
  const normalized=normalizePluginSettings(input,BUILTIN_MANIFESTS);
  assert.equal(normalized.plugins['larger-text'].size,18);
  assert.deepEqual(Object.keys(normalized.enabled),BUILTIN_MANIFESTS.map(m=>m.id));
  assert.equal(Object.hasOwn(normalized.enabled,'unknown'),false);
  assert.equal(Object.prototype.dsiPoison,undefined);
 }
});

test('inherited activation, unknown identifiers and truthy strings cannot start plugins',async()=>{
 let starts=0;
 const manifest=validateManifest({id:'guarded',version:'1.0.0',apiVersion:1,platforms:['browser'],capabilities:[],settings:{}});
 const runtime=new PluginRuntime({platform:'browser',plugins:[{manifest,start(){starts++;}}]});
 try{
  for(const input of [{enabled:Object.create({guarded:true})},{enabled:{guarded:'true',unknown:true}},{enabled:JSON.parse('{"__proto__":true,"constructor":true}')}])assert.deepEqual((await runtime.reconcile(input)).active,[]);
  assert.equal(starts,0);
 }finally{await runtime.dispose();}
});

test('unsafe manifest paths, confusable identifiers and oversized dependency lists are rejected',()=>{
 const base={id:'valid',version:'1.0.0',apiVersion:1,platforms:['browser'],settings:{}};
 for(const id of ['../outside','a/b','constructor','prototype','a\u202eb','\u0430','x'.repeat(81)])assert.throws(()=>validateManifest({...base,id}),/identifier/);
 assert.throws(()=>validateManifest({...base,dependencies:Array.from({length:65},(_,i)=>'item-'+i)}),/dependencies/);
 assert.throws(()=>validateManifest({...base,settings:JSON.parse('{"__proto__":{"type":"boolean","default":true}}')}),/identifier/);
});

test('late ignored-abort start cannot reattach resources after a safe-mode flood',async()=>{
 let finish,began;
 const startEntered=new Promise(resolve=>began=resolve);
 let scope,lateCleanup=0;
 const manifest={id:'late',version:'1.0.0',apiVersion:1,platforms:['browser'],capabilities:[],settings:{}};
 const runtime=new PluginRuntime({platform:'browser',startTimeout:1000,cleanupTimeout:20,plugins:[{manifest,start(context){scope=context.scope;began();return new Promise(resolve=>finish=resolve);}}]});
 const first=runtime.reconcile({enabled:{late:true}});await startEntered;
 const changes=Array.from({length:40},(_,i)=>runtime.reconcile({enabled:{late:i%2===0},safeMode:i===39}));
 await Promise.all(changes);
 assert.deepEqual(runtime.status.active,[]);
 assert.throws(()=>scope.own(()=>{}),/closed/);
 finish(()=>lateCleanup++);await first;await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(lateCleanup,1);assert.deepEqual(runtime.status.active,[]);await runtime.dispose();
});

test('public runtime reports cannot mutate internal activation or diagnostics',async()=>{
 const manifest={id:'broken',version:'1.0.0',apiVersion:1,platforms:['browser'],capabilities:[],settings:{}};
 const runtime=new PluginRuntime({platform:'browser',plugins:[{manifest,start(){throw Error('controlled failure');}}]});
 await runtime.reconcile({enabled:{broken:true}});
 const report=runtime.status;report.active.push('forged');report.diagnostics[0].message='forged';
 assert.deepEqual(runtime.status.active,[]);assert.equal(runtime.diagnostics[0].message,'controlled failure');await runtime.dispose();
});
