const api=window.dsiDesktop;
const $=id=>document.getElementById(id);
const buffers=new Map();let active=null;
const output=value=>{$('output').textContent=typeof value==='string'?value:JSON.stringify(value,null,2);};
function updateTabs(){
 $('tabs').replaceChildren();for(const [file,buffer]of buffers){const button=document.createElement('button');button.role='tab';button.setAttribute('aria-selected',String(active===file));button.textContent=file+(buffer.dirty?' •':'');button.onclick=()=>select(file);$('tabs').append(button);}
 $('state').textContent=[...buffers.values()].some(b=>b.dirty)?'Unsaved edits':'Saved';
}
function select(file){active=file;$('source').disabled=false;$('source').value=buffers.get(file).text;$('file-label').textContent=file;updateTabs();}
async function openFile(file){if(!buffers.has(file)){const record=await api.read(file);buffers.set(file,{...record,dirty:false});}select(file);}
async function project(info){if(!info)return;$('workspace').textContent=info.root;$('files').replaceChildren();for(const file of info.files){const button=document.createElement('button');button.className='file';button.textContent=file;button.onclick=()=>run(()=>openFile(file));$('files').append(button);}if(info.files.includes('plugin.ts'))await openFile('plugin.ts');}
async function run(fn){try{const result=await fn();if(result!==undefined)output(result);}catch(error){output(error.message);$('state').textContent='Action failed; editor buffers preserved';}}
function dirty(){return [...buffers.values()].some(b=>b.dirty);}
async function switchProject(fn){if(dirty()&&!confirm('This discards unsaved editor changes. Continue?'))return;const info=await fn();if(!info)return;buffers.clear();active=null;updateTabs();await project(info);}
$('new').onclick=()=>run(()=>switchProject(()=>api.createWorkspace()));$('open').onclick=()=>run(()=>switchProject(()=>api.openWorkspace()));
$('source').oninput=()=>{if(!active)return;const buffer=buffers.get(active);buffer.text=$('source').value;buffer.dirty=true;updateTabs();};
$('save').onclick=()=>run(async()=>{if(!active)throw Error('Select a file first');const buffer=buffers.get(active);const saved=await api.save({path:active,text:buffer.text,revision:buffer.revision});buffer.revision=saved.revision;buffer.dirty=false;updateTabs();return 'Saved '+active;});
$('reload').onclick=()=>run(async()=>{if(!active)return;if(buffers.get(active).dirty&&!confirm('Discard unsaved changes and reload the file?'))return;buffers.set(active,{...await api.read(active),dirty:false});select(active);return 'Reloaded '+active;});
$('diagnose').onclick=()=>run(async()=>{const result=await api.diagnose();$('diagnostics').replaceChildren();for(const error of result.errors){const button=document.createElement('button');button.textContent=error.file+':'+error.line+' '+error.message;button.onclick=()=>run(async()=>{await openFile(error.file);const lines=$('source').value.split('\n');const start=lines.slice(0,error.line-1).join('\n').length+(error.line>1?1:0);$('source').focus();$('source').setSelectionRange(start,start+lines[error.line-1].length);});$('diagnostics').append(button);}return result;});
async function savedAction(fn){if(dirty())throw Error('Save changed files before running this action.');return fn();}
for(const [id,method]of [['build','build'],['test','test'],['preview','preview'],['package','package']])$(id).onclick=()=>run(()=>savedAction(()=>api[method]()));
$('cancel').onclick=()=>run(()=>api.cancel());$('stop').onclick=()=>run(()=>api.stopPreview());
window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='Unsaved changes';}});
window.addEventListener('dsi-refresh-workspace',()=>run(async()=>project(await api.files())));
document.addEventListener('keydown',event=>{if(event.ctrlKey&&event.key.toLowerCase()==='s'){event.preventDefault();$('save').click();}if(event.ctrlKey&&event.key==='Enter'){event.preventDefault();$('build').click();}});
