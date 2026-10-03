import source from './permissions.json' with {type:'json'};

const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const exactKeys=(value,keys)=>{if(!record(value)||Object.keys(value).some(key=>!keys.includes(key))||keys.some(key=>!Object.hasOwn(value,key)))throw Error('Invalid permissions policy fields');};
const strings=(value,allowed)=>{if(!Array.isArray(value)||value.length>128||new Set(value).size!==value.length||value.some(item=>typeof item!=='string'||!allowed(item)))throw Error('Invalid permissions policy list');};
const fixed=(value,expected)=>{if(value!==expected)throw Error('Unsupported permissions policy decision');};
const url=value=>{const parsed=new URL(value);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash)throw Error('Invalid permissions policy URL');return parsed;};
const freeze=value=>{if(record(value)||Array.isArray(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function validatePermissionsPolicy(input){
 exactKeys(input,['schemaVersion','defaultDecision','discord','local','picker','preview','browser','android','qa']);
 fixed(input.schemaVersion,1);fixed(input.defaultDecision,'deny');
 const {discord:d,local:l,picker:p,preview:v,browser:b,android:a,qa:q}=input;
 exactKeys(d,['origin','channelsPathPrefix','deviceMediaTypes','deviceApproval','mainFrameOnly','nativeScreenCapture','screenSharing','externalLinkSchemes','externalLinkHosts','externalLinkApproval','credentialURLs','popups','webviews','notifications']);
 fixed(d.origin,'https://discord.com');fixed(d.channelsPathPrefix,'/channels/');strings(d.deviceMediaTypes,item=>['audio','video'].includes(item));
 fixed(d.deviceApproval,'per-request');fixed(d.mainFrameOnly,true);fixed(d.nativeScreenCapture,'guarded-modern-only');if(!['deny','guarded-modern-picker'].includes(d.screenSharing))throw Error('Invalid screen sharing mode');
 strings(d.externalLinkSchemes,item=>item==='https:');strings(d.externalLinkHosts,item=>/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(item));fixed(d.externalLinkApproval,'per-request');
 for(const key of ['credentialURLs','popups','webviews','notifications'])fixed(d[key],'deny');
 exactKeys(l,['permissions','ipcMainFrameOnly','dashboardChannels','workbenchChannels','popups','navigation','webviews']);fixed(l.ipcMainFrameOnly,true);strings(l.permissions,()=>false);
 strings(l.dashboardChannels,item=>/^dsi:[a-z-]+$/.test(item));strings(l.workbenchChannels,item=>/^(?:dsi|ide):[a-z-]+$/.test(item));for(const key of ['popups','navigation','webviews'])fixed(l[key],'deny');
 exactKeys(p,['requireUserGesture','requestTimeoutMs','maxSources','mainFrameOnly','systemAudio','sourceMetadata','sourceTypes']);fixed(p.requireUserGesture,true);fixed(p.mainFrameOnly,true);fixed(p.sourceMetadata,'redact-title');if(!['deny','explicit-entire-screen-only'].includes(p.systemAudio))throw Error('Invalid system audio policy');strings(p.sourceTypes,item=>['screen','window'].includes(item));
 if(!Number.isInteger(p.requestTimeoutMs)||p.requestTimeoutMs<1000||p.requestTimeoutMs>120000||!Number.isInteger(p.maxSources)||p.maxSources<1||p.maxSources>128)throw Error('Invalid screen picker limits');
 exactKeys(v,['permissions','networkSchemes','downloads','webrtcExternalTransport','gracefulStopMs']);strings(v.permissions,()=>false);strings(v.networkSchemes,item=>['data:','blob:'].includes(item));fixed(v.downloads,'deny');fixed(v.webrtcExternalTransport,'deny');
 if(!Number.isInteger(v.gracefulStopMs)||v.gracefulStopMs<1||v.gracefulStopMs>1000)throw Error('Invalid preview cleanup limit');
 exactKeys(b,['permissions','matches','pluginCapabilities']);strings(b.permissions,item=>item==='storage');strings(b.matches,item=>item===d.origin+d.channelsPathPrefix+'*');strings(b.pluginCapabilities,item=>['styles','dom','events'].includes(item));
 exactKeys(a,['labPermissions','managerPermissions','managerFeedURL','managerAssetPrefix','managerRedirectHosts','installApproval','unknownSourcesApproval','sameSignerRequired','rollback','receiverExported']);strings(a.labPermissions,()=>false);strings(a.managerPermissions,item=>['android.permission.REQUEST_INSTALL_PACKAGES','android.permission.INTERNET'].includes(item));
 const feed=url(a.managerFeedURL),assets=url(a.managerAssetPrefix);if(feed.search||feed.port||assets.search||assets.port||!assets.pathname.endsWith('/'))throw Error('Invalid production update scope');strings(a.managerRedirectHosts,item=>['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(item));fixed(a.installApproval,'system');fixed(a.unknownSourcesApproval,'system');fixed(a.sameSignerRequired,true);fixed(a.rollback,'deny');fixed(a.receiverExported,false);
 exactKeys(q,['managerFeedURL','managerAssetPrefix']);for(const key of Object.keys(q)){if(url(q[key]).origin!=='https://localhost:8443')throw Error('Invalid controlled QA policy URL');}
 return freeze(structuredClone(input));
}
export const PERMISSIONS=validatePermissionsPolicy(source);
export function officialURL(value){try{const u=new URL(value);return u.origin===PERMISSIONS.discord.origin&&!u.username&&!u.password;}catch{return false;}}
export function channelsURL(value){try{return officialURL(value)&&new URL(value).pathname.startsWith(PERMISSIONS.discord.channelsPathPrefix);}catch{return false;}}
export function approvedExternalHTTPS(value){try{const u=new URL(value),hosts=PERMISSIONS.discord.externalLinkHosts;return PERMISSIONS.discord.externalLinkSchemes.includes(u.protocol)&&!u.username&&!u.password&&(!hosts.length||hosts.includes(u.hostname))?u.href:null;}catch{return null;}}
export function localChannelAllowed(role,channel){return ['dashboard','workbench'].includes(role)&&PERMISSIONS.local[role==='workbench'?'workbenchChannels':'dashboardChannels'].includes(channel);}
export function previewURLAllowed(value){try{return PERMISSIONS.preview.networkSchemes.includes(new URL(value).protocol);}catch{return false;}}
export function browserManifest(template){for(const key of ['host_permissions','optional_permissions','optional_host_permissions','externally_connectable','oauth2'])if(Object.hasOwn(template,key))throw Error('Permission-bearing manifest fields belong in the central policy');const value=structuredClone(template);value.permissions=[...PERMISSIONS.browser.permissions];for(const script of value.content_scripts){script.matches=[...PERMISSIONS.browser.matches];script.world='ISOLATED';}return value;}
