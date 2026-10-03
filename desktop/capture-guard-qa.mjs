// Controlled original capture fixture only. No live Discord/account/source capture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const output=path.join(root,'.cache','capture-guard-qa-'+Date.now());await fs.mkdir(output,{recursive:true});
const child=spawn(path.join(here,'node_modules/electron/dist/electron.exe'),[path.join(here,'capture-guard-qa-electron.mjs')],{windowsHide:false,stdio:'inherit',env:{...process.env,DSI_CAPTURE_QA_OUTPUT:output}});
const timeout=setTimeout(()=>child.kill(),45000);
child.on('close',async code=>{clearTimeout(timeout);console.log('Capture guard evidence: '+output);if(code!==0){process.exitCode=1;return;}const result=JSON.parse(await fs.readFile(path.join(output,'result.json'),'utf8'));if(!result.ok)process.exitCode=1;});
