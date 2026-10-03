import fs from 'node:fs/promises';
import {realpathSync,readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateManifest } from '../src/plugins/runtime.mjs';

const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const allowed = new Set(['.mjs','.js','.ts','.css','.json','.md']);
const inside = (root, target) => target === root || (!path.relative(root,target).startsWith('..'+path.sep) && path.relative(root,target)!=='..' && !path.isAbsolute(path.relative(root,target)));
export class WorkspaceService {
  constructor({nodePath=process.execPath, electron=false}={}) { this.root=null; this.running=null; this.nodePath=nodePath; this.electron=electron; }
  async open(root) { const resolved=await fs.realpath(root); if (!(await fs.stat(resolved)).isDirectory()) throw Error('Select a directory');const previous=this.root;this.root=resolved;try{return await this.list();}catch(error){this.root=previous;throw error;} }
  async resolve(relative, {create=false}={}) {
    if (!this.root) throw Error('Open a workspace first');
    if (typeof relative!=='string' || !relative || path.isAbsolute(relative)) throw Error('Use a workspace-relative file path');
    if(process.platform==='win32'&&relative.includes(':'))throw Error('Windows alternate streams and drive-relative paths are not supported');
    const candidate=path.resolve(this.root,relative);
    if (!inside(this.root,candidate)) throw Error('Path escapes selected workspace');
    let actual;
    try { actual=await fs.realpath(candidate); } catch(error) { if (error.code!=='ENOENT' || !create) throw error; actual=path.join(await fs.realpath(path.dirname(candidate)),path.basename(candidate)); }
    if (!inside(this.root,actual)) throw Error('Symlink escapes selected workspace');
    try{const metadata=await fs.stat(actual);if(metadata.isFile()&&metadata.nlink>1)throw Error('Refusing multiply-linked workspace file');}catch(error){if(error.code!=='ENOENT'||!create)throw error;}
    return actual;
  }
  async list() {
    const files=[];
    const walk=async(relative='')=>{ for(const entry of await fs.readdir(await this.resolve(relative||'.'),{withFileTypes:true})) {
      if (entry.name.startsWith('.') || entry.name==='node_modules') continue;
      const next=path.join(relative,entry.name); if(entry.isSymbolicLink()) continue;
      if(entry.isDirectory()) await walk(next); else if(allowed.has(path.extname(next))) files.push(next.replaceAll('\\','/'));
      if(files.length>500) throw Error('Workspace exceeds 500 editable files; select a smaller plugin project');
    }};
    await walk(); return {root:this.root,files};
  }
  async read(relative) { const filename=await this.resolve(relative); if(!allowed.has(path.extname(filename))) throw Error('Unsupported text file type'); if((await fs.stat(filename)).size>1024*1024) throw Error('File exceeds 1 MB editor limit'); const text=await fs.readFile(filename,'utf8'); return {path:relative,text,revision:hash(text)}; }
  async save({path:relative,text,revision}) {
    if(typeof text!=='string'||Buffer.byteLength(text)>1024*1024) throw Error('File exceeds 1 MB editor limit');
    const filename=await this.resolve(relative,{create:true}); if(!allowed.has(path.extname(filename))) throw Error('Unsupported text file type');
    let current=null; try {current=await fs.readFile(filename,'utf8');} catch(error){if(error.code!=='ENOENT')throw error;}
    if((current===null?null:hash(current))!==revision) throw Error('External change detected. Reload this file before saving; your editor buffer is preserved.');
    await fs.writeFile(filename,text,'utf8'); return {path:relative,revision:hash(text)};
  }
  async manifest() {return validateManifest(JSON.parse((await this.read('manifest.json')).text));}
  async diagnostics() {
    const errors=[]; let manifest;
    try {manifest=await this.manifest();} catch(error){errors.push({file:'manifest.json',line:1,message:error.message});}
    const ts=await import('typescript');
    const {files}=await this.list();
    for(const file of files.filter(f=>/\.(?:m?js)$/.test(f))) {
      const {text}=await this.read(file);
      const result=ts.default.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext,checkJs:true}});
      for(const diagnostic of result.diagnostics||[]) { const pos=diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start||0); errors.push({file,line:(pos?.line||0)+1,message:ts.default.flattenDiagnosticMessageText(diagnostic.messageText,'\n')}); }
    }
    const typescriptFiles=await Promise.all(files.filter(f=>f.endsWith('.ts')).map(f=>this.resolve(f)));
    if(typescriptFiles.length){
      const options={target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext,moduleResolution:ts.default.ModuleResolutionKind.Bundler,noEmit:true,strict:true,skipLibCheck:true,types:[],allowImportingTsExtensions:true};
      const host=ts.default.createCompilerHost(options);
      const libraryRoot=realpathSync(path.dirname(ts.default.getDefaultLibFilePath(options)));
      const permitted=filename=>{try{const actual=realpathSync(filename);if(inside(libraryRoot,actual))return true;const metadata=statSync(actual);return inside(this.root,actual)&&(!metadata.isFile()||metadata.nlink<=1);}catch{return false;}};
      host.readFile=filename=>permitted(filename)?readFileSync(filename,'utf8'):undefined;
      host.fileExists=filename=>permitted(filename)&&existsSync(filename)&&statSync(filename).isFile();
      host.directoryExists=filename=>permitted(filename)&&statSync(filename).isDirectory();
      host.getDirectories=filename=>host.directoryExists(filename)?readdirSync(filename,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&permitted(path.join(filename,entry.name))).map(entry=>entry.name):[];
      host.getCurrentDirectory=()=>this.root;
      host.realpath=filename=>permitted(filename)?realpathSync(filename):filename;
      host.getSourceFile=(filename,languageVersion)=>{const text=host.readFile(filename);return text===undefined?undefined:ts.default.createSourceFile(filename,text,languageVersion,true);};
      host.writeFile=()=>{throw Error('Diagnostics cannot write files');};
      const program=ts.default.createProgram(typescriptFiles,options,host);
      for(const diagnostic of ts.default.getPreEmitDiagnostics(program)){
        const pos=diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start||0);errors.push({file:diagnostic.file?path.relative(this.root,diagnostic.file.fileName).replaceAll('\\','/'):'plugin.ts',line:(pos?.line||0)+1,message:ts.default.flattenDiagnosticMessageText(diagnostic.messageText,'\n')});
      }
    }
    return {ok:errors.length===0,errors,manifest};
  }
  async build() {
    const diagnostics=await this.diagnostics(); if(!diagnostics.ok) return diagnostics;
    const entry=await this.resolve('plugin.ts');
    const esbuild=await import('esbuild');
    const service=this;
    const result=await esbuild.build({entryPoints:[entry],bundle:true,write:false,format:'esm',platform:'browser',sourcemap:'external',outfile:'plugin.mjs',target:'es2022',logLevel:'silent',plugins:[{name:'selected-workspace-only',setup(build){build.onResolve({filter:/.*/},async args=>{
      if(args.kind==='entry-point')return {path:entry};
      if(!args.path.startsWith('.'))return {errors:[{text:'Only relative imports inside the selected plugin workspace are supported'}]};
      const resolved=path.resolve(args.resolveDir,args.path);
      if(!inside(service.root,resolved))return {errors:[{text:'Import escapes selected workspace'}]};
      try{return {path:await service.resolve(path.relative(service.root,resolved))};}catch(error){return {errors:[{text:error.message}]};}
    });}}]});
    const output=path.join(this.root,'.dsi-build');
    try { const real=await fs.realpath(output); if(!inside(this.root,real))throw Error('Build output symlink escapes workspace'); } catch(error){if(error.code!=='ENOENT')throw error;}
    await fs.mkdir(output,{recursive:true});
    for(const file of result.outputFiles) { const dest=path.join(output,path.basename(file.path)); try {const metadata=await fs.lstat(dest);if(metadata.isSymbolicLink())throw Error('Refusing symlink build output');if(metadata.isFile()&&metadata.nlink>1)throw Error('Refusing multiply-linked build output');}catch(error){if(error.code!=='ENOENT')throw error;} await fs.writeFile(dest,file.contents); }
    return {ok:true,manifest:diagnostics.manifest,output:'.dsi-build/plugin.mjs',bytes:result.outputFiles.reduce((n,f)=>n+f.contents.length,0)};
  }
  async test() {
    if(this.running) throw Error('A test process is already running');
    const {files}=await this.list(); const tests=files.filter(f=>f.endsWith('.test.mjs')); if(!tests.length)throw Error('No .test.mjs tests found');
    const paths=await Promise.all(tests.map(f=>this.resolve(f)));
    return new Promise((resolve,reject)=>{
      const environment={...process.env,...(this.electron?{ELECTRON_RUN_AS_NODE:'1'}:{})};delete environment.NODE_TEST_CONTEXT;
      const child=spawn(this.nodePath,['--test','--test-isolation=none',...paths],{cwd:this.root,windowsHide:true,env:environment,stdio:['ignore','pipe','pipe']});
      this.running=child; let output='',cancelled=false;
      const append=data=>{output=(output+data.toString()).slice(-100000);}; child.stdout.on('data',append);child.stderr.on('data',append);
      const timeout=setTimeout(()=>{cancelled=true;this.terminate(child);},30000);
      const finish=()=>{clearTimeout(timeout);clearTimeout(child.dsiKillDeadline);if(this.running===child)this.running=null;};
      child.on('error',error=>{finish();reject(error);});
      child.on('close',code=>{finish();const wasCancelled=cancelled||child.dsiCancelled===true;resolve({ok:code===0&&!wasCancelled,code,cancelled:wasCancelled,output});});
    });
  }
  terminate(child) {
    child.kill();
    if(process.platform!=='win32'&&!child.dsiKillDeadline)child.dsiKillDeadline=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');},500);
  }
  cancel() {if(this.running){this.running.dsiCancelled=true;this.terminate(this.running);return {cancelled:true};}return {cancelled:false};}
  async package() {
    const build=await this.build(); if(!build.ok)return build;
    const source=await fs.readFile(await this.resolve('.dsi-build/plugin.mjs'),'utf8');
    const artifact={format:'dsi-development-plugin',formatVersion:1,reviewed:false,manifest:build.manifest,sha256:hash(source),source};
    return {ok:true,filename:build.manifest.id+'.dsiplugin',text:JSON.stringify(artifact,null,2)+'\n',sha256:artifact.sha256};
  }
}
export async function createTemplate(root) {
  await fs.mkdir(root,{recursive:true}); if((await fs.readdir(root)).length)throw Error('Choose an empty folder for a new plugin');
  const manifest={id:'dsi-workbench-sample',version:'1.0.0',apiVersion:1,platforms:['browser','windows'],capabilities:['styles'],dependencies:[],conflicts:[],settings:{}};
  await fs.copyFile(new URL('../src/plugins/api.d.ts',import.meta.url),path.join(root,'dsi-api.d.ts'));
  await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(root,'plugin.ts'),`// Original DSI sample. Run only in the controlled development preview.\nimport type { DSIPlugin } from './dsi-api';\nconst plugin: DSIPlugin = {\n  manifest: ${JSON.stringify(manifest,null,2)},\n  start(context) {\n    context.scope.style(document, 'dsi-workbench-sample', '[data-fixture-message] { border-left: 4px solid #318c82; padding: 12px; }');\n  }\n};\nexport default plugin;\n`);
  await fs.writeFile(path.join(root,'plugin.test.mjs'),`// Build first: this test executes the compiled plugin, not source text.\nimport test from 'node:test';\nimport assert from 'node:assert/strict';\nimport plugin from './.dsi-build/plugin.mjs';\ntest('sample attaches its visual resource and releases it on stop', async t => {\n const fixture = { styles: [] };\n const previous = globalThis.document;\n globalThis.document = fixture;\n t.after(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });\n const cleanups = [];\n const controller = new AbortController();\n const scope = {\n  signal: controller.signal,\n  own(cleanup) { cleanups.push(cleanup); return cleanup; },\n  style(document, id, css) {\n   assert.equal(document, fixture);\n   assert.equal(typeof css, 'string');\n   assert.ok(css.trim().length > 0);\n   const resource = {id,css}; fixture.styles.push(resource);\n   return this.own(() => { const index = fixture.styles.indexOf(resource); if (index >= 0) fixture.styles.splice(index,1); });\n  }\n };\n const context = {platform:'windows',settings:{},services:{},scope,signal:controller.signal};\n const cleanup = await plugin.start(context);\n if (typeof cleanup === 'function') scope.own(cleanup);\n assert.equal(fixture.styles.length,1,'plugin must attach a visible style resource');\n controller.abort();\n for (const release of cleanups.splice(0).reverse()) await release();\n assert.equal(fixture.styles.length,0,'stop must remove every owned visual resource');\n});\n`);
  await fs.writeFile(path.join(root,'README.md'),'# Original DSI sample\n\nEdit plugin.ts, save, diagnose and BUILD before Run tests. The behavior test executes .dsi-build/plugin.mjs against an owned-style fixture and checks attachment/cleanup. Rebuild after source changes before rerunning tests. dsi-api.d.ts provides typed DSI API1 context/manifest checks. Launch the controlled preview after build; packaging exports an unreviewed development artifact.\n');
}
