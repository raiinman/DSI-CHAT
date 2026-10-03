import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,copyFileSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {preflight,preflightUpdate,MANAGER_PACKAGE,DEMO_PACKAGE} from './manager-qa.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
if(!sdk)throw Error('Set ANDROID_HOME for actual SDK Manager preflight tests');
const aapt2=path.join(sdk,'build-tools/35.0.1',process.platform==='win32'?'aapt2.exe':'aapt2');
const platform=path.join(sdk,'platforms/android-35/android.jar');
const cache=path.join(root,'.cache/android-manager-preflight-tests');mkdirSync(cache,{recursive:true});
const stage=mkdtempSync(path.join(cache,'stage-'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function apk(name,pkg,{testOnly=false,embedded,versionCode=1}={}){
 const filename=path.join(stage,name+'.apk'),manifest=path.join(stage,name+'.xml');
 writeFileSync(manifest,`<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${pkg}" android:versionCode="${versionCode}" android:versionName="1"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/><application android:label="Controlled preflight fixture" android:testOnly="${testOnly}"/></manifest>`);
 const args=['link','-o',filename,'--manifest',manifest,'-I',platform];
 if(embedded){const assets=path.join(stage,name+'-assets');mkdirSync(assets);copyFileSync(embedded,path.join(assets,'native-demo.apk'));args.push('-A',assets);}
 execFileSync(aapt2,args);return filename;
}
const fixture=apk('fixture',DEMO_PACKAGE);
function options(name,{managerPackage=MANAGER_PACKAGE,testOnly=false,embedded=fixture}={}){
 const managerApk=apk(name,managerPackage,{testOnly,embedded});
 const managerBytes=readFileSync(managerApk),fixtureBytes=readFileSync(fixture),reportFile=path.join(stage,name+'-report.json');
 writeFileSync(reportFile,JSON.stringify({schemaVersion:1,manager:{package:MANAGER_PACKAGE,sha256:hash(managerBytes),bytes:managerBytes.length},payload:{package:DEMO_PACKAGE,sha256:hash(fixtureBytes),bytes:fixtureBytes.length,asset:'native-demo.apk'}}));
 return {managerApk,fixtureApk:fixture,reportFile,aapt2};
}
function rejectBeforeAdb(value,expected){const result=spawnSync(process.execPath,[path.join(root,'android/manager-qa.mjs'),'--manager-apk',value.managerApk,'--fixture-apk',value.fixtureApk,'--report',value.reportFile,'--aapt2',aapt2,'--adb',path.join(stage,'ADB-MUST-NOT-BE-CALLED')],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,expected);assert.doesNotMatch(result.stderr,/ENOENT|spawnSync.*ADB-MUST/,'ADB was reached before strict preflight failure');}
test('controlled sideloadable packages with exact embedded fixture pass SDK preflight',()=>assert.equal(preflight(options('valid')).fixturePackage,DEMO_PACKAGE));
test('foreign Manager package cannot reach ADB',()=>rejectBeforeAdb(options('foreign',{managerPackage:'interactive.deadsignal.dsi.foreign'}),/outside exact controlled/));
test('test-only Manager cannot reach normal installer QA or ADB',()=>rejectBeforeAdb(options('test-only',{testOnly:true}),/normal sideloadable/));
test('modified APK bytes fail provenance before ADB',()=>{const value=options('mutated');const bytes=readFileSync(value.managerApk);bytes[0]^=1;writeFileSync(value.managerApk,bytes);rejectBeforeAdb(value,/provenance hash/);});
test('mismatched embedded fixture fails even when outer APK report hashes match',()=>{const other=apk('other-fixture',DEMO_PACKAGE,{testOnly:true});rejectBeforeAdb(options('embedded-mismatch',{embedded:other}),/Embedded fixture APK differs/);});
test('foreign demo cannot reach ADB even when its bytes are correctly hashed',()=>{const other=apk('foreign-demo','interactive.deadsignal.dsi.foreign');const value=options('foreign-demo-manager',{embedded:other});value.fixtureApk=other;const report=JSON.parse(readFileSync(value.reportFile,'utf8')),bytes=readFileSync(other);report.payload.sha256=hash(bytes);report.payload.bytes=bytes.length;writeFileSync(value.reportFile,JSON.stringify(report));rejectBeforeAdb(value,/outside exact controlled/);});
function updateOptions(name,pkg=MANAGER_PACKAGE){const filename=apk(name,pkg,{versionCode:2}),bytes=readFileSync(filename),reportFile=path.join(stage,name+'-report.json');writeFileSync(reportFile,JSON.stringify({schemaVersion:1,manager:{package:MANAGER_PACKAGE,sha256:hash(bytes),bytes:bytes.length,certificateSha256:'a'.repeat(64)}}));return {apk:filename,reportFile,aapt2};}
test('controlled newer update carries actual SDK version and byte provenance',()=>{const value=preflightUpdate(updateOptions('valid-update'));assert.equal(value.versionCode,2);assert.equal(value.minSdk,26);assert.equal(value.url,'https://localhost:8443/assets/update.apk');});
test('foreign update with matching outer provenance still fails SDK package identity',()=>assert.throws(()=>preflightUpdate(updateOptions('foreign-update','interactive.deadsignal.dsi.foreign')),/exact controlled/));
test('tampered controlled update fails trusted build hash',()=>{const value=updateOptions('tampered-update');writeFileSync(value.apk,Buffer.concat([readFileSync(value.apk),Buffer.from('modified')]));assert.throws(()=>preflightUpdate(value),/provenance mismatch/);});
