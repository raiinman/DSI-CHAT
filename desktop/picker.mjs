const api=window.dsiPicker;
const elements=Object.fromEntries(['sources','status','selection','share','cancel','audio','refresh','all','screens','windows'].map(id=>[id,document.getElementById(id)]));
let state,selected,filter='all',busy=false;
function render(){
 const sources=state.sources.filter(source=>filter==='all'||source.kind===(filter==='screens'?'screen':'window'));
 elements.sources.replaceChildren();
 for(const source of sources){
  const button=document.createElement('button');button.className='source';button.type='button';button.setAttribute('aria-pressed',String(selected===source.key));
  const image=document.createElement('img');image.src=source.thumbnail;image.alt='';
  const name=document.createElement('strong');name.textContent=source.name;name.title=source.name;
  const kind=document.createElement('small');kind.textContent=source.kind==='screen'?'Entire screen':'Single window';
  button.append(image,name,kind);button.onclick=()=>{selected=source.key;render();};elements.sources.append(button);
 }
 const source=state.sources.find(source=>source.key===selected);
 elements.selection.textContent=source?source.name:'No source selected';
 elements.share.disabled=busy||!source;
 elements.audio.disabled=busy||!state.audioAvailable||source?.kind!=='screen';
 if(elements.audio.disabled)elements.audio.checked=false;
 elements.status.textContent=sources.length?`${sources.length} ${sources.length===1?'source':'sources'} available. Choose a source to preview your selection.`:'No sources available here. Try Refresh or another filter.';
 for(const id of ['all','screens','windows'])elements[id].setAttribute('aria-pressed',String(filter===id));
}
for(const id of ['all','screens','windows'])elements[id].onclick=()=>{filter=id;render();};
elements.refresh.onclick=async()=>{if(busy)return;busy=true;let refreshed=false;elements.refresh.disabled=true;elements.share.disabled=true;elements.status.textContent='Refreshing sources…';try{state=await api.refresh();selected=undefined;refreshed=true;render();}catch{elements.status.textContent='The sharing request expired. Close this window and try again.';}finally{busy=false;elements.refresh.disabled=false;if(refreshed)render();}};
elements.cancel.onclick=()=>api.cancel().catch(()=>window.close());
elements.share.onclick=async()=>{if(busy||!selected)return;busy=true;elements.share.disabled=true;try{await api.select({requestId:state.requestId,key:selected,audio:elements.audio.checked});}catch{busy=false;render();elements.status.textContent='That selection is no longer available. Refresh and select it again.';}};
document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();elements.cancel.click();}});
try{state=await api.state();render();elements.cancel.focus();}catch{elements.status.textContent='This sharing request is no longer active.';}
