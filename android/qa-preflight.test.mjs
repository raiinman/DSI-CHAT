import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
if(!sdk)throw new Error('Set ANDROID_HOME to run APK preflight acceptance against the actual SDK.');
const aapt=path.join(sdk,'build-tools','35.0.1',process.platform==='win32'?'aapt2.exe':'aapt2');
const platform=path.join(sdk,'platforms','android-35','android.jar');
const cache=path.join(root,'.cache','android-preflight-tests');mkdirSync(cache,{recursive:true});const stage=mkdtempSync(path.join(cache,'stage-'));
const resources=path.join(stage,'resources.zip');execFileSync(aapt,['compile','--dir',path.join(root,'android','res'),'-o',resources]);
function fixture(name,transform){const manifest=path.join(stage,`${name}.xml`);writeFileSync(manifest,transform(readFileSync(path.join(root,'android','AndroidManifest.xml'),'utf8')));const apk=path.join(stage,`${name}.apk`);execFileSync(aapt,['link','-o',apk,'--manifest',manifest,'-I',platform,resources]);return apk;}
function reject(apk,expected){const result=spawnSync(process.execPath,[path.join(root,'android','emulator-qa.mjs'),'--apk',apk,'--aapt2',aapt,'--adb',path.join(stage,'ADB-MUST-NOT-BE-CALLED'),'--output',path.join(stage,'evidence')],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,expected);assert.doesNotMatch(result.stderr,/ENOENT|spawnSync.*ADB-MUST/,'ADB was invoked before fixture rejection');}
test('foreign APK package rejected before any ADB or installation',()=>reject(fixture('foreign',xml=>xml.replace('package="interactive.deadsignal.dsi.devhost"','package="interactive.deadsignal.dsi.foreign"')),/Refusing to install an APK outside/));
test('non-test-only APK rejected before any ADB or installation',()=>reject(fixture('not-test',xml=>xml.replace('android:testOnly="true"','android:testOnly="false"')),/must explicitly declare android:testOnly=true/));
