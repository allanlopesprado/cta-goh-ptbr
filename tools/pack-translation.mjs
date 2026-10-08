import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {deflateRawSync,inflateRawSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

// This intentionally supports small, classical ZIP archives, not ZIP64 or
// streamed data descriptors. The game reads a ZIP named default.pak.
const MAX_BYTES=64*1024*1024;
const DOS_DATE=((2000-1980)<<9)|(1<<5)|1; // 2000-01-01, midnight
const LOCAL=0x04034b50,CENTRAL=0x02014b50,END=0x06054b50;
const crcTable=Uint32Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
export function crc32(bytes){
 let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;
}
function fail(message){throw new Error(message);}
function contained(root,target){const rel=path.relative(root,target);return rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);}
function regularComponents(root,target,{allowMissing=false}={}){
 if(!contained(root,target))fail('Path must be contained in repository: '+target);
 const parts=path.relative(root,target).split(path.sep);
 let current=root;
 for(let i=0;i<parts.length;i++){
  current=path.join(current,parts[i]);
  let stat;try{stat=fs.lstatSync(current);}catch(error){if(error.code==='ENOENT'&&allowMissing)continue;throw error;}
  if(stat.isSymbolicLink())fail('Symlink path is not allowed: '+current);
  if(i<parts.length-1&&!stat.isDirectory())fail('Parent path is not a directory: '+current);
  if(!contained(root,fs.realpathSync(current)))fail('Resolved path escapes repository: '+current);
 }
}
function repository(repo){const root=fs.realpathSync(path.resolve(repo));if(!fs.statSync(root).isDirectory())fail('Repository is not a directory');return root;}
function sourceText(bytes,label){try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('Invalid UTF-8 source file: '+label);}}
function validatePortugueseInfo(text){
 // Read the small brace-based metadata grammar, preserving parent/child
 // relationships. Keys in comments, strings or unrelated blocks do not count.
 const tokens=[],lex=/\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|[;#][^\r\n]*|[{}]|"(?:[^"\\\r\n]|\\.)*"|[A-Za-z_][A-Za-z_0-9]*|[+-]?\d+(?:\.\d+)?/y;
 let offset=0;
 while(offset<text.length){
  lex.lastIndex=offset;const match=lex.exec(text);if(!match)fail('Invalid PT-BR localization.info token at '+offset);
  const raw=match[0];offset=lex.lastIndex;
  if(/^\s/.test(raw)||raw.startsWith('//')||raw.startsWith('/*')||raw.startsWith(';')||raw.startsWith('#'))continue;
  tokens.push({type:raw.startsWith('"')?'string':'plain',value:raw.startsWith('"')?raw.slice(1,-1):raw});
 }
 let cursor=0;
 const brace=value=>tokens[cursor]?.type==='plain'&&tokens[cursor].value===value;
 function block(){
  if(!brace('{'))fail('Invalid PT-BR localization.info block');cursor++;
  const key=tokens[cursor++];if(key?.type!=='plain'||! /^[A-Za-z_][A-Za-z_0-9]*$/.test(key.value))fail('Invalid PT-BR localization.info property');
  const values=[];
  while(!brace('}')){
   if(!tokens[cursor])fail('Unbalanced PT-BR localization.info block');
   values.push(brace('{')?block():tokens[cursor++]);
  }
  cursor++;return {type:'block',key:key.value,values};
 }
 const language=block();
 if(cursor!==tokens.length||language.key!=='language'||language.values.some(v=>v.type!=='block'))fail('Invalid PT-BR localization.info: expected one balanced language block');
 for(const [key,wanted] of [['code','pt_br'],['steamLanguageCode','brazilian']]){
  const properties=language.values.filter(v=>v.key===key);
  if(properties.length!==1||properties[0].values.length!==1||properties[0].values[0].type!=='string'||properties[0].values[0].value!==wanted)fail('Invalid PT-BR localization.info: '+key+' must be "'+wanted+'" exactly once as a direct language property');
 }
}
export function safeArchiveName(name){
 if(typeof name!=='string'||!name.startsWith('default/')||/[\\:\x00-\x1f\x7f]/.test(name)||name.endsWith('/'))fail('Unsafe archive path: '+name);
 if(name.split('/').some(p=>p===''||p==='.'||p==='..'||/[. ]$/.test(p)))fail('Unsafe archive path: '+name);
 return name;
}
export function collectTranslation(repo){
 const root=repository(repo);
 function readTree(locale){
  const source=path.join(root,'localization',locale),entries=[];
  regularComponents(root,source);
  if(!fs.statSync(source).isDirectory())fail(locale+' source is not a directory');
  function walk(dir){
   for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
    const absolute=path.join(dir,item.name),stat=fs.lstatSync(absolute);
    if(stat.isSymbolicLink())fail('Symlink in '+locale+' source: '+absolute);
    if(stat.isDirectory()){walk(absolute);continue;}
    if(!stat.isFile())fail('Non-regular '+locale+' source: '+absolute);
    const relative=path.relative(source,absolute).split(path.sep).join('/');
    if(!relative.endsWith('.pot')&&relative!=='localization.info')fail('Unexpected '+locale+' source file: '+relative);
    const bytes=fs.readFileSync(absolute),text=sourceText(bytes,locale+'/'+relative);
    if(locale==='pt_BR'&&relative==='localization.info')validatePortugueseInfo(text);
    entries.push({name:safeArchiveName('default/'+relative),...(locale==='pt_BR'?{bytes}:{})});
   }
  }
  walk(source);
  if(!entries.some(e=>e.name==='default/localization.info')||!entries.some(e=>e.name.endsWith('.pot')))fail('Expected localization.info and .pot catalogs in '+locale);
  return entries;
 }
 const english=readTree('en'),entries=readTree('pt_BR'),englishNames=new Set(english.map(e=>e.name));
 for(const e of entries)if(!englishNames.has(e.name))fail('Unexpected PT-BR catalog absent from English: '+e.name);
 const portugueseNames=new Set(entries.map(e=>e.name));
 for(const e of english)if(!portugueseNames.has(e.name))fail('Missing PT-BR catalog from English inventory: '+e.name);
 const seen=new Set();for(const e of entries){const key=e.name.toLowerCase();if(seen.has(key))fail('Duplicate source name: '+e.name);seen.add(key);}
 if(entries.reduce((n,e)=>n+e.bytes.length,0)>MAX_BYTES)fail('Translation exceeds small ZIP size limit');
 return entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
}
export function encodeZip(entries,{method=0}={}){
 if(![0,8].includes(method))fail('Only stored/deflate methods are supported');
 if(entries.length>=65535)fail('ZIP64 is not supported');
 const names=new Set(),locals=[],centrals=[];let offset=0;
 for(const entry of [...entries].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
  safeArchiveName(entry.name);
  const key=entry.name.toLowerCase();if(names.has(key))fail('Duplicate ZIP name: '+entry.name);names.add(key);
  const name=Buffer.from(entry.name,'utf8'),bytes=Buffer.from(entry.bytes),data=method===0?bytes:deflateRawSync(bytes,{level:9}),crc=crc32(bytes);
  if(name.length>65535||bytes.length>MAX_BYTES||data.length>MAX_BYTES)fail('Entry exceeds small ZIP size limit');
  const local=Buffer.alloc(30);local.writeUInt32LE(LOCAL,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(method,8);local.writeUInt16LE(DOS_DATE,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(CENTRAL,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(method,10);central.writeUInt16LE(DOS_DATE,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);
  locals.push(local,name,data);centrals.push(central,name);offset+=local.length+name.length+data.length;
 }
 const directory=Buffer.concat(centrals),end=Buffer.alloc(22);
 if(offset+directory.length+end.length>MAX_BYTES)fail('Archive exceeds small ZIP size limit');
 end.writeUInt32LE(END,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,directory,end]);
}
function range(bytes,offset,size,label){if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(size)||offset<0||size<0||offset+size>bytes.length)fail('Invalid ZIP bounds: '+label);}
function extras(bytes,start,size){
 range(bytes,start,size,'extra field');let cursor=start;
 while(cursor<start+size){if(cursor+4>start+size)fail('Malformed ZIP extra field header');range(bytes,cursor,4,'extra field header');const id=bytes.readUInt16LE(cursor),length=bytes.readUInt16LE(cursor+2);cursor+=4;if(cursor+length>start+size)fail('Malformed ZIP extra field');if(id===1)fail('ZIP64 is not supported');cursor+=length;}
}
function decodeName(bytes,flags){
 if(!(flags&0x800)&&bytes.some(b=>b>127))fail('Non-ASCII name without UTF-8 flag');
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('Invalid UTF-8 ZIP name');}
}
function flagsAndMethod(flags,method){
 if(flags&0x41)fail('Encrypted ZIP entry is not allowed');
 if(![0,8].includes(method))fail('Unsupported ZIP compression method');
 const allowed=0x800|(method===8?6:0);
 if(flags&~allowed)fail('Unsupported ZIP flags/data descriptor');
}
export function verifyZip(bytes,expected){
 if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);
 if(bytes.length>MAX_BYTES||bytes.length<22)fail('Invalid small ZIP archive size');
 const end=bytes.length-22;
 if(bytes.readUInt32LE(end)!==END)fail('Missing terminal ZIP end record or trailing bytes/comment');
 if(bytes.readUInt16LE(end+4)!==0||bytes.readUInt16LE(end+6)!==0)fail('Multi-disk ZIP is not supported');
 const count=bytes.readUInt16LE(end+10),directorySize=bytes.readUInt32LE(end+12),directoryOffset=bytes.readUInt32LE(end+16);
 if(bytes.readUInt16LE(end+8)!==count||count===65535||directorySize===0xffffffff||directoryOffset===0xffffffff)fail('ZIP64 or inconsistent entry counts');
 if(bytes.readUInt16LE(end+20)!==0||directoryOffset+directorySize!==end)fail('Invalid ZIP directory layout');
 range(bytes,directoryOffset,directorySize,'central directory');
 const wanted=new Map(expected.map(e=>[e.name,Buffer.from(e.bytes)]));
 if(wanted.size!==expected.length)fail('Duplicate expected inventory');
 if(count!==expected.length)fail('Archive inventory count mismatch: '+count+' versus '+expected.length);
 const names=new Set(),regions=[];let cursor=directoryOffset,totalBytes=0;
 for(let index=0;index<count;index++){
  range(bytes,cursor,46,'central header');if(cursor+46>end||bytes.readUInt32LE(cursor)!==CENTRAL)fail('Invalid central ZIP header');
  const version=bytes.readUInt16LE(cursor+6),flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),crc=bytes.readUInt32LE(cursor+16),packed=bytes.readUInt32LE(cursor+20),unpacked=bytes.readUInt32LE(cursor+24),nameLength=bytes.readUInt16LE(cursor+28),extraLength=bytes.readUInt16LE(cursor+30),commentLength=bytes.readUInt16LE(cursor+32),disk=bytes.readUInt16LE(cursor+34),attrs=bytes.readUInt32LE(cursor+38),localOffset=bytes.readUInt32LE(cursor+42);
  flagsAndMethod(flags,method);
  if(version>20||disk!==0||packed===0xffffffff||unpacked===0xffffffff||localOffset===0xffffffff)fail('Unsupported classical ZIP entry');
  if((attrs&0x10)||((attrs>>>16)&0xf000)===0xa000||((attrs>>>16)&0xf000)===0x4000)fail('Directory/symlink ZIP entry is not allowed');
  const centralEnd=cursor+46+nameLength+extraLength+commentLength;
  if(centralEnd>end)fail('Central ZIP entry exceeds directory');
  const encodedName=bytes.subarray(cursor+46,cursor+46+nameLength),name=safeArchiveName(decodeName(encodedName,flags));
  const key=name.toLowerCase();if(names.has(key))fail('Duplicate ZIP entry name: '+name);names.add(key);
  const expectedBytes=wanted.get(name);if(!expectedBytes)fail('Unexpected archive file: '+name);
  if(unpacked!==expectedBytes.length)fail('Stale/content size mismatch: '+name);
  extras(bytes,cursor+46+nameLength,extraLength);
  range(bytes,localOffset,30,'local header');if(localOffset+30>directoryOffset||bytes.readUInt32LE(localOffset)!==LOCAL)fail('Invalid local ZIP header');
  if(bytes.readUInt16LE(localOffset+4)!==version||bytes.readUInt16LE(localOffset+6)!==flags||bytes.readUInt16LE(localOffset+8)!==method||bytes.readUInt16LE(localOffset+10)!==bytes.readUInt16LE(cursor+12)||bytes.readUInt16LE(localOffset+12)!==bytes.readUInt16LE(cursor+14)||bytes.readUInt32LE(localOffset+14)!==crc||bytes.readUInt32LE(localOffset+18)!==packed||bytes.readUInt32LE(localOffset+22)!==unpacked)fail('Local/central metadata mismatch: '+name);
  const localNameLength=bytes.readUInt16LE(localOffset+26),localExtraLength=bytes.readUInt16LE(localOffset+28),payloadOffset=localOffset+30+localNameLength+localExtraLength;
  if(payloadOffset+packed>directoryOffset)fail('ZIP payload overlaps central directory');
  range(bytes,localOffset+30,localNameLength+localExtraLength,'local name/extra');
  if(!bytes.subarray(localOffset+30,localOffset+30+localNameLength).equals(encodedName))fail('Local/central path mismatch: '+name);
  extras(bytes,localOffset+30+localNameLength,localExtraLength);
  const payload=bytes.subarray(payloadOffset,payloadOffset+packed);
  if(method===0&&packed!==unpacked)fail('Stored ZIP size mismatch: '+name);
  let actual;
  try{if(method===0)actual=payload;else{const inflated=inflateRawSync(payload,{maxOutputLength:Math.max(1,unpacked),info:true});if(inflated.engine.bytesWritten!==packed)fail('Trailing bytes in deflate stream');actual=inflated.buffer;}}catch(error){fail('Invalid deflate data: '+name+' ('+error.message+')');}
  if(actual.length!==unpacked||crc32(actual)!==crc)fail('ZIP CRC32/content length mismatch: '+name);
  if(!actual.equals(expectedBytes))fail('Stale/content byte mismatch: '+name);
  regions.push({start:localOffset,end:payloadOffset+packed,name});totalBytes+=actual.length;cursor=centralEnd;
 }
 if(cursor!==end)fail('Unexpected bytes in central directory');
 let next=0;for(const region of regions.sort((a,b)=>a.start-b.start)){if(region.start!==next)fail('ZIP local records overlap or contain gaps/preamble');next=region.end;}
 if(next!==directoryOffset)fail('Unexpected bytes before central directory');
 if(names.size!==wanted.size)fail('Missing archive files');
 return {files:count,bytes:totalBytes,archiveBytes:bytes.length,crc32:'verified',content:'exact expected bytes',root:'default/'};
}
export function resolveOutput(repo,output='dist/default.pak'){
 const root=repository(repo),dist=path.join(root,'dist'),target=path.resolve(root,output);
 if(!contained(dist,target)||!target.endsWith('.pak')||path.basename(target).length<=4)fail('Output must be a .pak file contained in repository/dist');
 if(path.relative(root,target).split(path.sep).some(p=>/[\x00-\x1f:]/.test(p)||/[. ]$/.test(p)))fail('Unsafe output path');
 regularComponents(root,target,{allowMissing:true});
 if(fs.existsSync(target)&&!fs.lstatSync(target).isFile())fail('Output is not a regular file');
 return {root,dist,target};
}
export function checkTranslation(repo,{output='dist/default.pak'}={}){
 const {target}=resolveOutput(repo,output),expected=collectTranslation(repo);
 if(fs.statSync(target).size>MAX_BYTES)fail('Archive exceeds small ZIP size limit');
 return {...verifyZip(fs.readFileSync(target),expected),locale:'pt_BR',output:target};
}
export function buildTranslation(repo,{output='dist/default.pak'}={}){
 const destination=resolveOutput(repo,output),expected=collectTranslation(repo),bytes=encodeZip(expected),result=verifyZip(bytes,expected);
 fs.mkdirSync(path.dirname(destination.target),{recursive:true});
 regularComponents(destination.root,destination.target,{allowMissing:true});
 const temporary=path.join(path.dirname(destination.target),'.'+path.basename(destination.target)+'.'+randomUUID()+'.tmp');
 let created=false;
 try{
  const fd=fs.openSync(temporary,'wx');created=true;
  try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  // Verify the actual bytes on disk before atomically replacing the old archive.
  verifyZip(fs.readFileSync(temporary),expected);
  regularComponents(destination.root,destination.target,{allowMissing:true});
  fs.renameSync(temporary,destination.target);
 }finally{if(created&&fs.existsSync(temporary))fs.unlinkSync(temporary);}
 return {...result,locale:'pt_BR',output:destination.target,reproducibleDate:'2000-01-01T00:00:00 (DOS)'};
}
export function parseArguments(argv){
 const options={mode:'check',output:'dist/default.pak',repo:process.cwd()};let modeSeen=false;
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--help')return {help:true};
  if(arg==='--repo'||arg==='--output'){if(!argv[i+1]||argv[i+1].startsWith('--'))fail('Missing value for '+arg);const key=arg.slice(2);if(options[key+'Set'])fail('Duplicate '+arg);options[key]=argv[++i];options[key+'Set']=true;}
  else if(arg==='--build'||arg==='--check'){if(modeSeen)fail('Choose exactly one --build or --check');modeSeen=true;options.mode=arg.slice(2);}
  else fail('Unknown argument: '+arg);
 }
 return options;
}
export function main(argv=process.argv.slice(2)){
 const args=parseArguments(argv);
 if(args.help){console.log('node tools/pack-translation.mjs [--repo PATH] [--build|--check] [--output dist/default.pak]\nDefault repository: current directory. Default mode: read-only --check. Output paths are relative to the repository and must stay in its dist directory.');return;}
 const result=args.mode==='build'?buildTranslation(args.repo,args):checkTranslation(args.repo,args);
 console.log(JSON.stringify({mode:args.mode,...result},null,2));return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
