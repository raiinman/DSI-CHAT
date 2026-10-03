import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import https from 'node:https';

export const MANAGER_PACKAGE='interactive.deadsignal.dsi.manager';
export const DEMO_PACKAGE='interactive.deadsignal.dsi.managerdemo';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const attr=value=>value.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function zipEntry(bytes,name){
 let end=-1;for(let n=bytes.length-22;n>=Math.max(0,bytes.length-65557);n--){if(bytes.readUInt32LE(n)===0x06054b50){end=n;break;}}
 if(end<0)throw Error('APK ZIP directory missing');
 let cursor=bytes.readUInt32LE(end+16);const count=bytes.readUInt16LE(end+10);
 for(let n=0;n<count;n++){
  if(bytes.readUInt32LE(cursor)!==0x02014b50)throw Error('Invalid APK ZIP directory');
  const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),size=bytes.readUInt32LE(cursor+20),expanded=bytes.readUInt32LE(cursor+24),nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),offset=bytes.readUInt32LE(cursor+42);
  const filename=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
  if(filename===name){if(flags&1||expanded>50*1024*1024)throw Error('Unsupported embedded APK entry');if(bytes.readUInt32LE(offset)!==0x04034b50)throw Error('Invalid APK entry');const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);const compressed=bytes.subarray(start,start+size);const result=method===0?compressed:method===8?inflateRawSync(compressed,{maxOutputLength:50*1024*1024}):null;if(!result||result.length!==expanded)throw Error('Invalid embedded APK bytes');return result;}
  cursor+=46+nameLength+extra+comment;
 }
 throw Error('Embedded controlled fixture APK missing');
}
export function preflight({managerApk,fixtureApk,reportFile,aapt2}){
 const report=JSON.parse(readFileSync(reportFile,'utf8'));
 if(report.schemaVersion!==1)throw Error('Unsupported Manager build provenance schema');
 const manager=readFileSync(managerApk),fixture=readFileSync(fixtureApk);
 for(const [bytes,record,expected]of [[manager,report.manager,MANAGER_PACKAGE],[fixture,report.payload,DEMO_PACKAGE]]){
  if(record?.package!==expected||record.sha256!==digest(bytes)||record.bytes!==bytes.length)throw Error('Controlled Manager/fixture provenance hash or package mismatch');
 }
 for(const [apk,expected]of [[managerApk,MANAGER_PACKAGE],[fixtureApk,DEMO_PACKAGE]]){
  const badging=execFileSync(aapt2,['dump','badging',apk],{encoding:'utf8'});
  const header=badging.split('\n').find(line=>line.startsWith('package:'));
  if(!header?.includes(`name='${expected}'`)||header.includes("split='"))throw Error('Refusing APK outside exact controlled Manager/demo packages');
  const manifest=execFileSync(aapt2,['dump','xmltree',apk,'--file','AndroidManifest.xml'],{encoding:'utf8'});
  if(/android:testOnly[^\r\n]*(?:=true|0xffffffff)/.test(manifest))throw Error('Manager/demo must be normal sideloadable APKs for genuine PackageInstaller acceptance');
 }
 if(report.payload.asset!=='native-demo.apk')throw Error('Controlled embedded APK asset path missing');
 if(digest(zipEntry(manager,'assets/'+report.payload.asset))!==digest(fixture))throw Error('Embedded fixture APK differs from reviewed standalone fixture');
 return {managerPackage:MANAGER_PACKAGE,fixturePackage:DEMO_PACKAGE,managerSha256:digest(manager),fixtureSha256:digest(fixture)};
}
export function preflightUpdate({apk,reportFile,aapt2}){
 const report=JSON.parse(readFileSync(reportFile,'utf8')),record=report.manager,bytes=readFileSync(apk);
 if(report.schemaVersion!==1||record?.package!==MANAGER_PACKAGE||record.sha256!==digest(bytes)||record.bytes!==bytes.length||!record.certificateSha256?.match(/^[a-f0-9]{64}$/))throw Error('Controlled update provenance mismatch');
 const badging=execFileSync(aapt2,['dump','badging',apk],{encoding:'utf8'}),header=badging.split('\n').find(line=>line.startsWith('package:'));
 if(!header?.includes(`name='${MANAGER_PACKAGE}'`)||header.includes("split='"))throw Error('Update APK is outside exact controlled Manager package');
 const manifest=execFileSync(aapt2,['dump','xmltree',apk,'--file','AndroidManifest.xml'],{encoding:'utf8'});
 if(/android:testOnly[^\r\n]*(?:=true|0xffffffff)/.test(manifest))throw Error('Update APK must allow normal Android installation');
 const versionCode=Number(header.match(/versionCode='(\d+)'/)?.[1]),versionName=header.match(/versionName='([^']+)'/)?.[1],minSdk=Number(badging.match(/(?:minSdkVersion|sdkVersion):'(\d+)'/)?.[1]);
 if(!Number.isSafeInteger(versionCode)||versionCode<2||!Number.isSafeInteger(minSdk)||minSdk<26)throw Error('Controlled update version/SDK invalid');
 return {schemaVersion:1,package:MANAGER_PACKAGE,versionCode,versionName,minSdk,bytes:bytes.length,sha256:digest(bytes),certificateSha256:record.certificateSha256,url:'https://localhost:8443/assets/update.apk'};
}
export async function runManagerQA(args=process.argv.slice(2)){
 const option=(key,fallback)=>{const n=args.indexOf(key);if(n>=0&&!args[n+1])throw Error('Missing value for '+key);return n<0?fallback:args[n+1];};
 const serial=option('--serial','emulator-5554');if(!/^emulator-\d+$/.test(serial))throw Error('Manager QA operates only on an explicitly selected emulator');
 const managerApk=option('--manager-apk'),fixtureApk=option('--fixture-apk'),reportFile=option('--report');
 if(!managerApk||!fixtureApk||!reportFile)throw Error('Pass --manager-apk, --fixture-apk and --report for the controlled Manager/demo build');
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
 let aapt2=option('--aapt2');if(!aapt2&&sdk){for(const version of readdirSync(path.join(sdk,'build-tools')).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}))){const candidate=path.join(sdk,'build-tools',version,process.platform==='win32'?'aapt2.exe':'aapt2');if(existsSync(candidate)){aapt2=candidate;break;}}}
 if(!aapt2)throw Error('Mandatory APK preflight needs --aapt2 or ANDROID_HOME');
 const verified=preflight({managerApk,fixtureApk,reportFile,aapt2});
 const updateApk=option('--update-apk'),updateReport=option('--update-report'),tlsCert=option('--tls-cert'),tlsKey=option('--tls-key');
 let updateFeed,server,feedMode='valid',badSignerFeed,badSignerBytes;
 if(updateApk||updateReport||tlsCert||tlsKey){
  if(!updateApk||!updateReport||!tlsCert||!tlsKey)throw Error('Update QA needs explicit APK/report/TLS certificate/key');
  updateFeed=preflightUpdate({apk:updateApk,reportFile:updateReport,aapt2});
  const managerProvenance=JSON.parse(readFileSync(reportFile,'utf8'));if(managerProvenance.qaBuild!==true)throw Error('Local HTTPS update tests require explicit compile-time QA Manager build');
  const installedSigner=managerProvenance.manager.certificateSha256;
  if(updateFeed.certificateSha256!==installedSigner)throw Error('Positive update fixture must have the Manager signer');
  const badSignerApk=option('--bad-signer-apk'),badSignerReport=option('--bad-signer-report');
  if(badSignerApk||badSignerReport){if(!badSignerApk||!badSignerReport)throw Error('Pass both bad-signer controlled fixture paths');badSignerFeed=preflightUpdate({apk:badSignerApk,reportFile:badSignerReport,aapt2});if(badSignerFeed.certificateSha256===installedSigner)throw Error('Bad-signer fixture unexpectedly shares installed signer');badSignerBytes=readFileSync(badSignerApk);}
  const updateBytes=readFileSync(updateApk);
  server=https.createServer({cert:readFileSync(tlsCert),key:readFileSync(tlsKey)},(request,response)=>{
   if(request.url==='/manager.json'){
    const feed=feedMode==='archive-signer'?{...badSignerFeed,certificateSha256:installedSigner}:{...updateFeed};if(feedMode==='downgrade')feed.versionCode=0;if(feedMode==='certificate')feed.certificateSha256='0'.repeat(64);if(feedMode==='hash')feed.sha256='0'.repeat(64);
    response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify(feed));
   }else if(request.url==='/assets/update.apk'){response.writeHead(200,{'Content-Type':'application/vnd.android.package-archive'});response.end(feedMode==='archive-signer'?badSignerBytes:updateBytes);}
   else{response.writeHead(404);response.end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(8443,'127.0.0.1',resolve);});
  server.unref();
 }
 const adb=option('--adb','adb'),output=path.resolve(option('--output','.cache/android-manager-evidence'));
 mkdirSync(output,{recursive:true});
 const run=(...command)=>execFileSync(adb,['-s',serial,...command],{encoding:'utf8',timeout:120000});
 let emulatorVerified=false;
 try{
 if(run('shell','getprop','ro.kernel.qemu').trim()!=='1')throw Error('Target is not an Android emulator');
 emulatorVerified=true;
 if(server)run('reverse','tcp:8443','tcp:8443');
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const nodes=xml=>[...xml.matchAll(/<node\s+([^>]+)>/g)].map(match=>Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(item=>[item[1],attr(item[2])])));
 const dump=()=>{run('shell','uiautomator','dump','/sdcard/dsi-manager-qa.xml');return run('shell','cat','/sdcard/dsi-manager-qa.xml');};
 const tap=async node=>{const bounds=node.bounds?.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);if(!bounds)throw Error('Control has no valid bounds');run('shell','input','tap',String(Math.round((+bounds[1]+ +bounds[3])/2)),String(Math.round((+bounds[2]+ +bounds[4])/2)));await pause(500);};
 const wait=async(predicate,label)=>{for(let attempt=0;attempt<25;attempt++){const current=nodes(dump());const value=predicate(current);if(value)return value;await pause(350);}throw Error('Timed out waiting for '+label);};
 const advance=async(predicate,label)=>{for(let attempt=0;attempt<25;attempt++){const current=nodes(dump()),target=predicate(current);if(target)return target;const next=current.find(item=>item.package===MANAGER_PACKAGE&&(item['content-desc']==='Continue setup'||item.text==='Continue setup'));if(next)await tap(next);else await pause(350);}throw Error('Timed out advancing to '+label);};
 const click=async(description)=>{for(let attempt=0;attempt<12;attempt++){const current=nodes(dump()),match=current.find(item=>(item['content-desc']===description||item.text===description)&&item.enabled!=='false');if(match){await tap(match);return;}if(attempt>=2){const scroll=current.find(item=>item.scrollable==='true')||current[0],bounds=scroll?.bounds?.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);if(!bounds)throw Error('Current UI has no scroll viewport');const x=String(Math.round((+bounds[1]+ +bounds[3])/2)),top=+bounds[2],height=+bounds[4]-top;run('shell','input','swipe',x,String(Math.round(top+height*.8)),x,String(Math.round(top+height*.2)),'300');}await pause(350);}throw Error('Missing usable action '+description);};
 const capture=name=>{writeFileSync(path.join(output,name+'.png'),execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:120000}));writeFileSync(path.join(output,name+'.xml'),dump());};
 const installer=item=>/^(?:com\.google\.android\.packageinstaller|com\.android\.packageinstaller|com\.google\.android\.permissioncontroller|com\.android\.permissioncontroller)$/.test(item.package||'');
 const installed=()=>run('shell','pm','list','packages',DEMO_PACKAGE).split(/\r?\n/).includes('package:'+DEMO_PACKAGE);
 if(run('shell','pm','list','packages',MANAGER_PACKAGE).split(/\r?\n/).includes('package:'+MANAGER_PACKAGE))run('uninstall',MANAGER_PACKAGE);
 run('install',managerApk);run('shell','pm','clear',MANAGER_PACKAGE);
 if(installed())run('uninstall',DEMO_PACKAGE);
 run('shell','appops','set',MANAGER_PACKAGE,'REQUEST_INSTALL_PACKAGES','default');
 run('shell','settings','put','system','font_scale','1.0');run('logcat','-c');
 const launch=()=>run('shell','am','start','-W','-n',MANAGER_PACKAGE+'/.MainActivity');
 launch();await pause(600);capture('manager-default');
 await click('Start guided setup');
 capture('manager-permission-or-error');
 const permission=await advance(items=>{const settingsLabels=items.filter(item=>item.package==='com.android.settings').map(item=>item.text);if(!settingsLabels.includes('Install unknown apps')||!settingsLabels.some(text=>text==='DSI Manager QA'||text==='DSI Manager'))return;return items.find(item=>item.package==='com.android.settings'&&item.enabled==='true'&&(item['resource-id'].endsWith('/switch_widget')||item['resource-id'].endsWith('/switch')||/Switch/.test(item.class)||(item.checkable==='true'&&item.clickable==='true')));}, 'normal unknown-app source permission screen');
 capture('manager-source-permission');if(permission.checked!=='true')await tap(permission);
 await wait(items=>items.find(item=>item.package==='com.android.settings'&&item.checkable==='true'&&item.checked==='true'),'explicit unknown-source permission enabled');
 run('shell','input','keyevent','KEYCODE_BACK');await pause(600);capture('manager-permission-return');
 const cancel=await advance(items=>items.find(item=>installer(item)&&(/^cancel$/i.test(item.text)||item['resource-id']==='android:id/button2')), 'real PackageInstaller confirmation');
 capture('manager-install-confirmation');await tap(cancel);
 await wait(items=>items.find(item=>item['content-desc']==='Retry setup'||item.text==='Retry setup'),'declined installation retry');
 if(installed())throw Error('Declined installer unexpectedly installed fixture');capture('manager-declined');
 await click('Retry setup');
 const install=await wait(items=>items.find(item=>installer(item)&&(/^install$/i.test(item.text)||item['resource-id']==='android:id/button1')),'real PackageInstaller Install control');
 await tap(install);
 for(let attempt=0;attempt<40&&!installed();attempt++)await pause(350);
 if(!installed())throw Error('PackageInstaller did not install controlled fixture');
 run('shell','input','keyevent','KEYCODE_BACK');launch();
 await wait(items=>items.find(item=>item.text.includes('Sample app ready')),'installed status');capture('manager-installed');
 await click('Open sample app');await pause(600);capture('manager-open-fixture');
 const resumed=run('shell','dumpsys','activity','activities');if(!resumed.split('\n').some(line=>/mResumedActivity|topResumedActivity/.test(line)&&line.includes(DEMO_PACKAGE)))throw Error('Open sample app did not launch controlled fixture in foreground');
 run('shell','am','force-stop',MANAGER_PACKAGE);launch();await wait(items=>items.find(item=>item.text.includes('Sample app ready')),'relaunch installation reconciliation');capture('manager-relaunched');
 run('shell','settings','put','system','font_scale','1.4');run('shell','am','force-stop',MANAGER_PACKAGE);launch();await pause(600);capture('manager-large-font');
 run('shell','settings','put','system','font_scale','1.0');
 let updaterResults;
 if(server){
  run('shell','am','force-stop',MANAGER_PACKAGE);launch();
  for(const mode of ['downgrade','certificate','hash',...(badSignerFeed?['archive-signer']:[])]){
   feedMode=mode;await click('Check for updates');
   if(mode==='hash'||mode==='archive-signer'){await wait(items=>items.find(item=>item.text.includes('is available')),'available negative update');await click('Update DSI Manager');}
   await wait(items=>items.find(item=>item.text==='Update check needs attention'||item.text==='Setup needs attention'),mode+' rejected');capture('manager-update-rejected-'+mode);
   const screen=dump();if(nodes(screen).some(installer))throw Error('Rejected '+mode+' update reached Android installer');
   const expected={downgrade:/would downgrade/,certificate:/signing certificate is unsupported/,hash:/SHA-256 integrity check failed/,'archive-signer':/APK package\/version\/SDK\/signing certificate verification failed/}[mode];
   if(!nodes(screen).some(item=>expected.test(item.text)))throw Error(mode+' rejection did not identify its intended verification gate');
   const dismiss=nodes(screen).find(item=>item.package===MANAGER_PACKAGE&&item.text==='OK');if(dismiss)await tap(dismiss);
  }
  feedMode='valid';await click('Check for updates');await wait(items=>items.find(item=>item.text.includes('is available')),'verified update availability');capture('manager-update-available');
  await click('Update DSI Manager');
  const approve=await wait(items=>items.find(item=>installer(item)&&(/^(?:update|install)$/i.test(item.text)||item['resource-id']==='android:id/button1')),'real Manager update approval');capture('manager-update-confirmation');await tap(approve);
  let updated=false;for(let attempt=0;attempt<40;attempt++){const info=run('shell','dumpsys','package',MANAGER_PACKAGE);if(info.includes('versionCode='+updateFeed.versionCode+' ')){updated=true;break;}await pause(350);}
  if(!updated)throw Error('Normal Android installer did not install same-signer update');
  launch();await wait(items=>items.find(item=>item.text.includes('Sample app ready')),'settings retained after update');capture('manager-update-installed');
  updaterResults={https:true,downgradeRejected:true,certificateMetadataRejected:true,archiveSignerRejected:Boolean(badSignerFeed),hashRejected:true,nativeApproval:true,versionCode:updateFeed.versionCode,settingsRetained:true};
 }
 const logs=run('logcat','-d','-s','AndroidRuntime:E','DSI_MANAGER:I');if(logs.includes('FATAL EXCEPTION'))throw Error('Manager/native fixture runtime crash');
 writeFileSync(path.join(output,'manager-runtime.log'),logs);
 const result={...verified,emulator:serial,controlledFixtureOnly:true,actualPackageInstaller:true,permissionSettingsReturn:true,declineRecovery:true,installed:true,openFixture:true,relaunchReconciled:true,largeFontCapture:true,updater:updaterResults,discordAttached:false};
 writeFileSync(path.join(output,'manager-qa-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }catch(error){
  if(emulatorVerified){
   try{writeFileSync(path.join(output,'manager-failure.png'),execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000}));}catch{}
   try{run('shell','uiautomator','dump','/sdcard/dsi-manager-qa-failure.xml');writeFileSync(path.join(output,'manager-failure.xml'),run('shell','cat','/sdcard/dsi-manager-qa-failure.xml'));}catch{}
   try{writeFileSync(path.join(output,'manager-failure.log'),run('logcat','-d','-s','AndroidRuntime:E','DSI_MANAGER:I','DSI_MANAGER_UPDATE:I'));}catch{}
   try{writeFileSync(path.join(output,'manager-failure-activity.txt'),run('shell','dumpsys','activity','activities'));}catch{}
  }
  writeFileSync(path.join(output,'manager-qa-failure.json'),JSON.stringify({error:error.message,controlledFixtureOnly:true,emulatorVerified,discordAttached:false},null,2)+'\n');
  throw error;
 }finally{
  if(emulatorVerified){try{run('shell','settings','put','system','font_scale','1.0');}catch{}if(server)try{run('reverse','--remove','tcp:8443');}catch{}}
  if(server?.listening)await new Promise(resolve=>server.close(resolve));
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await runManagerQA();
