import {PERMISSIONS} from './policy.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function androidManifest(template,kind){
 if(!['lab','manager'].includes(kind))throw Error('Unknown Android policy target');
 if(!/<manifest\b/.test(template)||!/<uses-sdk\b[^>]*\/>/.test(template))throw Error('Invalid manifest template');
 if(/<permission\b|<uses-permission-sdk-|<uses-permission\b[^>]*[^/]>/i.test(template))throw Error('Unsupported permission-bearing manifest element');
 const permissions=PERMISSIONS.android[kind==='lab'?'labPermissions':'managerPermissions'];
 return template.replace(/\s*<uses-permission\b[^>]*\/>/g,'')
  .replace(/(<uses-sdk\b[^>]*\/>)/,'$1\n'+permissions.map(name=>` <uses-permission android:name="${name}"/>`).join('\n'))
  .replace(/(<receiver\b[^>]*android:exported=")[^"]*(")/g,'$1'+String(PERMISSIONS.android.receiverExported)+'$2');
}
export function managerUpdateConfig(qa=false){
 const target=qa?PERMISSIONS.qa:PERMISSIONS.android;
 const literal=value=>JSON.stringify(value);
 return `package interactive.deadsignal.dsi.manager;
// Generated from security/permissions.json. Edit that policy, then rebuild.
final class ManagerUpdateConfig {
 static final boolean QA_BUILD=${qa};
 static final String FEED_URL=${literal(target.managerFeedURL)};
 static final String ASSET_PREFIX=${literal(target.managerAssetPrefix)};
 static final String QA_ASSET_PREFIX=${literal(qa?target.managerAssetPrefix:'')};
 static final String[] REDIRECT_HOSTS={${PERMISSIONS.android.managerRedirectHosts.map(literal).join(',')}};
}
`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [kind,output,mode]=process.argv.slice(2);
 if(!output||!['lab','manager'].includes(kind)||!['production','qa',undefined].includes(mode))throw Error('Invalid policy generation arguments');
 await fs.mkdir(output,{recursive:true});
 const root=new URL('../',import.meta.url);
 await fs.writeFile(path.join(output,'lab-manifest.xml'),androidManifest(await fs.readFile(new URL('android/AndroidManifest.xml',root),'utf8'),'lab'));
 if(kind==='manager'){
  await fs.writeFile(path.join(output,'manager-manifest.xml'),androidManifest(await fs.readFile(new URL('android/manager/AndroidManifest.xml',root),'utf8'),'manager'));
  await fs.writeFile(path.join(output,'ManagerUpdateConfig.java'),managerUpdateConfig(mode==='qa'));
 }
}
