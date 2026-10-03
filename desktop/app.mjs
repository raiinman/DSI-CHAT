const api=window.dsiDesktop;
const status=document.querySelector('#status');
const initial=await api.status();
const ids=initial.manifests.map(manifest=>manifest.id);
const container=document.querySelector('.feature-box');
for(const manifest of initial.manifests){if(document.getElementById(manifest.id))continue;const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id=manifest.id;label.append(checkbox,document.createTextNode(' '+(manifest.name||manifest.id)));label.title=manifest.description||'';container.insertBefore(label,document.querySelector('#safe-mode').parentElement);}
async function action(fn){try{await fn();const state=await api.status();status.textContent=state.status;}catch(error){status.textContent=error.message;}}
for(const id of ids)document.getElementById(id).checked=initial.settings.enabled[id]===true;
document.querySelector('#safe-mode').checked=initial.settings.safeMode;status.textContent=initial.status;
for(const id of [...ids,'safe-mode'])document.getElementById(id).addEventListener('change',()=>action(()=>api.setFeatures({safeMode:document.querySelector('#safe-mode').checked,enabled:Object.fromEntries(ids.map(id=>[id,document.getElementById(id).checked]))})));
document.querySelector('#fixture').onclick=()=>action(()=>api.openFixture());
document.querySelector('#workbench').onclick=()=>action(()=>api.openWorkbench());
document.querySelector('#discord').onclick=()=>action(()=>api.openDiscord());
