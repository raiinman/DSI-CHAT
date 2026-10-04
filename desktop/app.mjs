const api=window.dsiDesktop;
const status=document.querySelector('#status');
const initial=await api.status();
const ids=initial.manifests.map(manifest=>manifest.id);
const container=document.querySelector('.feature-box');
const numeric=[];
for(const manifest of initial.manifests){if(document.getElementById(manifest.id))continue;const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id=manifest.id;label.append(checkbox,document.createTextNode(' '+(manifest.name||manifest.id)));label.title=manifest.description||'';container.insertBefore(label,document.querySelector('#safe-mode').parentElement);}
for(const manifest of initial.manifests){for(const [key,descriptor]of Object.entries(manifest.settings)){if(descriptor.type!=='number')continue;const label=document.createElement('label');label.className='plugin-value';const input=document.createElement('input');input.type='number';input.id=manifest.id+'-'+key;input.value=initial.settings.plugins[manifest.id]?.[key]??descriptor.default;if(descriptor.min!==undefined)input.min=descriptor.min;if(descriptor.max!==undefined)input.max=descriptor.max;input.step=descriptor.step??'any';label.append(document.createTextNode((descriptor.label||key)+' '),input);container.insertBefore(label,document.querySelector('#safe-mode').parentElement);numeric.push({manifest,key,input});}}
async function action(fn){try{await fn();const state=await api.status();status.textContent=state.status;}catch(error){status.textContent=error.message;}}
for(const id of ids)document.getElementById(id).checked=initial.settings.enabled[id]===true;
document.querySelector('#safe-mode').checked=initial.settings.safeMode;status.textContent=initial.status;
function saveSettings(){const plugins=structuredClone(initial.settings.plugins);for(const {manifest,key,input}of numeric){plugins[manifest.id]??={};plugins[manifest.id][key]=input.valueAsNumber;}return action(async()=>{const result=await api.setFeatures({safeMode:document.querySelector('#safe-mode').checked,enabled:Object.fromEntries(ids.map(id=>[id,document.getElementById(id).checked])),plugins});for(const {manifest,key,input}of numeric)input.value=result.settings.plugins[manifest.id][key];});}
for(const id of [...ids,'safe-mode'])document.getElementById(id).addEventListener('change',saveSettings);
for(const {manifest,input}of numeric)input.addEventListener('change',()=>{document.getElementById(manifest.id).checked=true;saveSettings();});
document.querySelector('#fixture').onclick=()=>action(()=>api.openFixture());
document.querySelector('#workbench').onclick=()=>action(()=>api.openWorkbench());
document.querySelector('#discord').onclick=()=>action(()=>api.openDiscord());
document.querySelector('#discord-browser').onclick=()=>action(()=>api.openDiscordBrowser());
document.querySelector('#discord-reload').onclick=()=>action(()=>api.reloadDiscord());
function hostStatus(state){const host=state.discordHost;document.querySelector('#discord-state').textContent='Host: '+(host.phase==='document-loaded'?'Document loaded; client rendering unverified':host.phase)+(host.page?' · '+host.page:'')+(host.permission?' · '+host.permission:'')+(host.errorCode?' · network error '+host.errorCode:'');}
hostStatus(initial);setInterval(()=>api.status().then(state=>{hostStatus(state);status.textContent=state.status;}).catch(()=>{}),1000);
