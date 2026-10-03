import test from 'node:test';
import assert from 'node:assert/strict';
import {PERMISSIONS,validatePermissionsPolicy,localChannelAllowed,previewURLAllowed,browserManifest} from '../security/policy.mjs';
import {androidManifest,managerUpdateConfig} from '../security/android-build.mjs';

test('unknown or unsafe permission decisions fail closed',()=>{
 for(const mutate of [p=>p.local.permissions.push('media'),p=>p.defaultDecision='allow',p=>p.extraRule=true,p=>p.discord.mainFrameOnly=false,p=>p.discord.deviceApproval='automatic',p=>p.discord.nativeScreenCapture='allow',p=>p.preview.permissions.push('media'),p=>p.browser.permissions.push('tabs'),p=>p.android.sameSignerRequired=false,p=>p.android.managerAssetPrefix='https://github.com/trusted',p=>p.android.receiverExported=true,p=>p.android.managerRedirectHosts.push('evil.invalid'),p=>p.picker.sourceMetadata='expose-title',p=>p.picker.requireUserGesture=false]){
  const policy=structuredClone(PERMISSIONS);mutate(policy);assert.throws(()=>validatePermissionsPolicy(policy));
 }
 const tighter=structuredClone(PERMISSIONS);tighter.discord.deviceMediaTypes=[];tighter.browser.permissions=[];tighter.android.managerPermissions=[];tighter.picker.maxSources=1;
 assert.equal(validatePermissionsPolicy(tighter).picker.maxSources,1);
 assert.throws(()=>PERMISSIONS.discord.deviceMediaTypes.push('display-capture'));
});
test('policy limits privileged IPC and preview transport',()=>{
 assert.equal(localChannelAllowed('dashboard','ide:save'),false);
 assert.equal(localChannelAllowed('workbench','ide:save'),true);
 assert.equal(localChannelAllowed('rogue','dsi:status'),false);
 for(const url of ['https://discord.com','file:///private','http://127.0.0.1:1234','invalid'])assert.equal(previewURLAllowed(url),false);
 assert.equal(previewURLAllowed('data:text/plain,fixture'),true);
});
test('platform packages derive permissions from the single policy',()=>{
 const template={content_scripts:[{js:['content.js']}],permissions:['tabs']};const built=browserManifest(template);
 assert.throws(()=>browserManifest({...template,host_permissions:['https://evil.invalid/*']}));assert.throws(()=>androidManifest('<manifest><uses-sdk/><uses-permission-sdk-23 android:name="evil"/></manifest>','manager'));
 assert.deepEqual(built.permissions,PERMISSIONS.browser.permissions);assert.equal(template.permissions[0],'tabs');
 const manifest=androidManifest('<manifest><uses-sdk/><uses-permission android:name="evil"/><receiver android:exported="true"/></manifest>','manager');
 assert.ok(!manifest.includes('evil'));assert.ok(manifest.includes('android:exported="false"'));
 for(const permission of PERMISSIONS.android.managerPermissions)assert.ok(manifest.includes(permission));
 const production=managerUpdateConfig();assert.ok(production.includes(PERMISSIONS.android.managerFeedURL));assert.ok(!production.includes('https://localhost'));
 assert.ok(managerUpdateConfig(true).includes(PERMISSIONS.qa.managerFeedURL));
});
