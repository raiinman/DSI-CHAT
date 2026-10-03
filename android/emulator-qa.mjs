import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2);
const option=(key,fallback)=>{const index=args.indexOf(key);return index<0?fallback:args[index+1];};
const adb=option('--adb','adb');const serial=option('--serial','emulator-5554');
if(!/^emulator-\d+$/.test(serial))throw new Error('This QA script installs only into an explicitly selected emulator.');
const apk=option('--apk');if(!apk)throw new Error('Pass --apk with the controlled DSI patched fixture APK.');
const output=path.resolve(option('--output','.cache/android-emulator-evidence'));mkdirSync(output,{recursive:true});
const run=(...command)=>execFileSync(adb,['-s',serial,...command],{encoding:'utf8',timeout:120000});
const pause=async()=>new Promise(resolve=>setTimeout(resolve,800));
const decode=value=>value.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function dump(){run('shell','uiautomator','dump','/sdcard/dsi-native-qa.xml');return run('shell','cat','/sdcard/dsi-native-qa.xml');}
function nodes(xml){return [...xml.matchAll(/<node\s+([^>]+)>/g)].map(match=>Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(item=>[item[1],decode(item[2])])));}
async function click(text,desc=false){const xml=dump();const field=desc===true?'content-desc':typeof desc==='string'?desc:'text';const node=nodes(xml).find(item=>item[field]===text&&item.bounds);if(!node)throw new Error(`Missing native control ${text}`);const bounds=node.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);if(!bounds)throw new Error('Invalid UI bounds');run('shell','input','tap',String(Math.round((+bounds[1]+ +bounds[3])/2)),String(Math.round((+bounds[2]+ +bounds[4])/2)));await pause();}
function capture(name){writeFileSync(path.join(output,`${name}.png`),execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:120000}));writeFileSync(path.join(output,`${name}.xml`),dump());}
const pkg='interactive.deadsignal.dsi.devhost';
const metadata=execFileSync(adb,['-s',serial,'shell','getprop','ro.kernel.qemu'],{encoding:'utf8'}).trim();if(metadata!=='1')throw new Error('Selected target is not an Android emulator');
run('install','-r',path.resolve(apk));run('shell','pm','clear',pkg);run('logcat','-c');
run('shell','am','start','-W','-n',`${pkg}/.MainActivity`);await pause();
const logs=run('logcat','-d','-s','DSI_BOOTSTRAP:I','DSI_FIXTURE:I','AndroidRuntime:E');
if(!logs.includes('Original Application preserved')||!logs.includes('native bootstrap installed'))throw new Error('Original application/bootstrap did not both start');
if(logs.includes('FATAL EXCEPTION'))throw new Error('Android runtime crash');
capture('native-default');
await click('Open DSI native plugin settings',true);
await click('Readable native text (+15%)');await click('Compact native line spacing');await click('Reduce native window motion');
let xml=dump();for(const id of ['native-readable-text','native-compact-layout','native-reduced-motion'])if(!decode(xml).includes(`${id}=active`))throw new Error(`Native plugin not active: ${id}`);
capture('native-plugins-active');
await click('Safe mode');xml=dump();if(!decode(xml).includes('native-readable-text=safe mode'))throw new Error('Safe mode did not stop plugins');capture('native-safe-mode');
await click('android:id/button1','resource-id');run('shell','am','force-stop',pkg);run('shell','am','start','-W','-n',`${pkg}/.MainActivity`);await pause();await click('Open DSI native plugin settings',true);
xml=dump();const choices=nodes(xml);for(const text of ['Safe mode','Readable native text (+15%)','Compact native line spacing','Reduce native window motion'])if(!choices.some(item=>item.text===text&&item.checked==='true'))throw new Error(`Saved native choice lost: ${text}`);
await click('Safe mode');xml=dump();if(!decode(xml).includes('native-readable-text=active'))throw new Error('Leaving safe mode did not reactivate saved native plugin');capture('native-restored');
await click('android:id/button1','resource-id');const finalLogs=run('logcat','-d','-s','DSI_BOOTSTRAP:I','DSI_FIXTURE:I','AndroidRuntime:E');if(finalLogs.includes('FATAL EXCEPTION'))throw new Error('Native lifecycle crashed');writeFileSync(path.join(output,'native-runtime.log'),finalLogs);
writeFileSync(path.join(output,'qa-report.json'),JSON.stringify({platform:'android',host:'original-patched-native-fixture',emulator:serial,bootstrapStarted:true,originalApplicationPreserved:true,pluginControls:3,safeMode:true,reloadPersistence:true,discordAttached:false},null,2)+'\n');
console.log('Native emulator QA passed: bootstrap, original application, three plugin toggles, safe mode, reload persistence. Discord attachment remains unverified.');
