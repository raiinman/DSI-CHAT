import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(await readFile(new URL('./tooling.lock.json',import.meta.url),'utf8')).apktool;
const folder=path.join(root,'.cache','android-tools');
const destination=path.join(folder,`apktool-${lock.version}.jar`);
await mkdir(folder,{recursive:true});
const valid=data=>data.length===lock.bytes&&createHash('sha256').update(data).digest('hex')===lock.sha256;
let present;try{present=await readFile(destination);}catch{}
if(present&&!valid(present))throw new Error('Existing Apktool checksum differs; preserve and investigate this file.');
if(!present){const response=await fetch(lock.url);if(!response.ok)throw new Error(`Apktool download ${response.status}`);const data=Buffer.from(await response.arrayBuffer());if(!valid(data))throw new Error('Apktool checksum verification failed');await writeFile(destination,data,{flag:'wx'});}
console.log(`Verified Apktool ${lock.version}: ${destination}`);
