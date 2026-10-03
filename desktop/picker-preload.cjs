const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('dsiPicker',Object.freeze({
 state:()=>ipcRenderer.invoke('dsi:picker-state'),
 select:selection=>ipcRenderer.invoke('dsi:picker-select',selection),
 cancel:()=>ipcRenderer.invoke('dsi:picker-cancel'),
 refresh:()=>ipcRenderer.invoke('dsi:picker-refresh')
}));
