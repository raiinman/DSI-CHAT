import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WorkspaceService,createTemplate} from './service.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'dsi-adversarial-')),selected=path.join(root,'selected'),outside=path.join(root,'outside');await createTemplate(selected);await fs.mkdir(outside);const service=new WorkspaceService();await service.open(selected);const results={};
try{
 const sentinel=path.join(outside,'sentinel.ts');await fs.writeFile(sentinel,'CONTROLLED_OUTSIDE_SENTINEL');await fs.link(sentinel,path.join(selected,'linked.ts'));let blocked;try{const record=await service.read('linked.ts');await service.save({...record,text:'CONTROLLED_HARDLINK_MUTATION'});}catch(error){blocked=error.message;}results.hardlink={blocked,outsideMutated:await fs.readFile(sentinel,'utf8')==='CONTROLLED_HARDLINK_MUTATION',links:(await fs.stat(sentinel)).nlink};await fs.unlink(path.join(selected,'linked.ts'));
 if(process.platform==='win32'){try{await service.save({path:'plugin.ts:invisible.ts',text:'CONTROLLED_STREAM',revision:null});results.alternateDataStream={accepted:true,listed:(await service.list()).files.includes('plugin.ts:invisible.ts'),read:(await service.read('plugin.ts:invisible.ts')).text};}catch(error){results.alternateDataStream={accepted:false,error:error.message};}}
 const pidfile=path.join(outside,'child.pid');await service.save({...await service.read('plugin.test.mjs'),text:`import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:['ignore','inherit','inherit'],windowsHide:true});writeFileSync(${JSON.stringify(pidfile)},String(child.pid));setInterval(()=>{},1000);`});
 const running=service.test();let pid;for(let n=0;n<40;n++){try{pid=Number(await fs.readFile(pidfile,'utf8'));break;}catch{await new Promise(resolve=>setTimeout(resolve,50));}}if(!pid)throw Error('Controlled child fixture did not launch');
 await new Promise(resolve=>setTimeout(resolve,250));let aliveBefore=false;try{process.kill(pid,0);aliveBefore=true;}catch{}
 const began=Date.now();service.cancel();const settled=await Promise.race([running.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),2000))]);let childAlive=false;try{process.kill(pid,0);childAlive=true;}catch{}results.processTree={grandchildAliveBeforeCancel:aliveBefore,cancelSettledWithin2s:settled,grandchildSurvived:childAlive,elapsedMs:Date.now()-began};try{process.kill(pid);}catch{}await running;
 console.log(JSON.stringify(results,null,2));
}finally{service.cancel();if(!root.startsWith(path.join(os.tmpdir(),'dsi-adversarial-')))throw Error('Unsafe fixture cleanup');await fs.rm(root,{recursive:true,force:true});}
