import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {crc32,safeArchiveName,collectTranslation,encodeZip,verifyZip,resolveOutput,buildTranslation,checkTranslation,parseArguments} from './pack-translation.mjs';

const script=fileURLToPath(new URL('./pack-translation.mjs',import.meta.url));
const relativeFiles=['interface/text/desc/aa.pot','interface/text/desc/bb.pot'];
function fixture(t){
 const temporary=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'cta-pak-test-')),repo=path.join(temporary,'repo'),outside=path.join(temporary,'outside');
 fs.mkdirSync(outside,{recursive:true});
 for(const locale of ['en','pt_BR']){
  const folder=path.join(repo,'localization',locale);fs.mkdirSync(path.join(folder,'interface','text','desc'),{recursive:true});
  fs.writeFileSync(path.join(folder,'localization.info'),Buffer.from(locale==='pt_BR'?'{language {code "pt_br"} {steamLanguageCode "brazilian"}}\r\n':'{language {code "default"} {steamLanguageCode "english"}}\r\n'));
  relativeFiles.forEach((file,i)=>fs.writeFileSync(path.join(folder,file),locale==='pt_BR'?Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),Buffer.from(`msgctxt "${i}"\r\nmsgid "Tank"\r\nmsgstr "Canhão ${i}"\r\n`)]):Buffer.from(`msgctxt "${i}"\nmsgid "Tank"\nmsgstr ""\n`)));
 }
 t.after(()=>{assert.ok(path.basename(temporary).startsWith('cta-pak-test-'));assert.equal(path.dirname(temporary),fs.realpathSync(os.tmpdir()));fs.rmSync(temporary,{recursive:true,force:true});});
 return {temporary,repo,outside,entries:collectTranslation(repo),source:file=>path.join(repo,'localization','pt_BR',file),english:file=>path.join(repo,'localization','en',file),output:path.join(repo,'dist','default.pak')};
}
function records(zip){
 const end=zip.length-22,result=[];let cursor=zip.readUInt32LE(end+16);
 for(let i=0;i<zip.readUInt16LE(end+10);i++){
  const nameLength=zip.readUInt16LE(cursor+28),extraLength=zip.readUInt16LE(cursor+30),commentLength=zip.readUInt16LE(cursor+32),local=zip.readUInt32LE(cursor+42);
  result.push({central:cursor,local,nameLength,name:zip.subarray(cursor+46,cursor+46+nameLength).toString('utf8'),payload:local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28)});
  cursor+=46+nameLength+extraLength+commentLength;
 }
 return result;
}
function renameRecord(zip,record,name,{local=true,central=true}={}){
 const encoded=Buffer.from(name);assert.equal(encoded.length,record.nameLength);
 if(local)encoded.copy(zip,record.local+30);if(central)encoded.copy(zip,record.central+46);
}
function both(zip,record,localField,centralField,value,size=4){
 zip[size===4?'writeUInt32LE':'writeUInt16LE'](value,record.local+localField);
 zip[size===4?'writeUInt32LE':'writeUInt16LE'](value,record.central+centralField);
}

test('CRC32 standard vector and empty content',()=>{
 assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);assert.equal(crc32(Buffer.alloc(0)),0);
});
test('inventory derives matching EN/PT catalog paths, not a fixed count',t=>{
 const f=fixture(t);assert.equal(f.entries.length,3);assert.deepEqual(f.entries.map(e=>e.name),['default/interface/text/desc/aa.pot','default/interface/text/desc/bb.pot','default/localization.info']);
});
test('stored and deflated archives preserve BOM, UTF-8, CRLF and exact bytes',t=>{
 const f=fixture(t);
 for(const method of [0,8]){const zip=encodeZip(f.entries,{method});const result=verifyZip(zip,f.entries);assert.equal(result.files,3);assert.equal(result.content,'exact expected bytes');assert.equal(result.bytes,f.entries.reduce((n,e)=>n+e.bytes.length,0));}
});
test('reproducible build ignores source timestamps and directory enumeration order',t=>{
 const f=fixture(t),a=encodeZip(f.entries),b=encodeZip([...f.entries].reverse());assert.deepEqual(a,b);
 buildTranslation(f.repo);const first=fs.readFileSync(f.output);
 for(const file of [...relativeFiles,'localization.info'])fs.utimesSync(f.source(file),new Date(),new Date());
 buildTranslation(f.repo);assert.deepEqual(first,fs.readFileSync(f.output));assert.equal(checkTranslation(f.repo).files,3);
 for(const r of records(first)){assert.equal(first.readUInt16LE(r.local+10),0);assert.equal(first.readUInt16LE(r.local+12),0x2821);}
});
test('build replaces only its requested .pak atomically and leaves no temp file',t=>{
 const f=fixture(t);fs.mkdirSync(path.dirname(f.output));fs.writeFileSync(f.output,'prior package');fs.writeFileSync(path.join(path.dirname(f.output),'keep.txt'),'untouched');
 buildTranslation(f.repo);assert.equal(checkTranslation(f.repo).files,3);assert.equal(fs.readFileSync(path.join(path.dirname(f.output),'keep.txt'),'utf8'),'untouched');assert.deepEqual(fs.readdirSync(path.dirname(f.output)).sort(),['default.pak','keep.txt']);
});
test('invalid source inventory leaves existing package untouched',t=>{
 const f=fixture(t);fs.mkdirSync(path.dirname(f.output));fs.writeFileSync(f.output,'prior package');fs.writeFileSync(f.source('unexpected.txt'),'extra');
 assert.throws(()=>buildTranslation(f.repo),/Unexpected pt_BR source file/);assert.equal(fs.readFileSync(f.output,'utf8'),'prior package');
});
test('replacing an output hardlink does not overwrite its outside original',t=>{
 const f=fixture(t),outside=path.join(f.outside,'original.pak');fs.writeFileSync(outside,'outside original');fs.mkdirSync(path.dirname(f.output));fs.linkSync(outside,f.output);
 buildTranslation(f.repo);assert.equal(checkTranslation(f.repo).files,3);assert.equal(fs.readFileSync(outside,'utf8'),'outside original');
});
test('missing PT catalog and localization.info are rejected',t=>{
 const f=fixture(t);fs.unlinkSync(f.source(relativeFiles[0]));assert.throws(()=>collectTranslation(f.repo),/Missing PT-BR catalog/);
 fs.unlinkSync(f.source('localization.info'));assert.throws(()=>collectTranslation(f.repo),/localization.info/);
});
test('extra PT catalog absent from EN is rejected',t=>{
 const f=fixture(t);fs.writeFileSync(f.source('extra.pot'),'extra');assert.throws(()=>collectTranslation(f.repo),/Unexpected PT-BR catalog absent from English/);
});
test('EN-side changes cannot be silently omitted',t=>{
 const f=fixture(t);fs.writeFileSync(f.english('new.pot'),'new');assert.throws(()=>collectTranslation(f.repo),/Missing PT-BR catalog/);
});
test('invalid UTF-8 catalogs and info are rejected without rewriting bytes',t=>{
 const f=fixture(t),original=fs.readFileSync(f.source(relativeFiles[0]));fs.writeFileSync(f.source(relativeFiles[0]),Buffer.from([0xc3,0x28]));assert.throws(()=>collectTranslation(f.repo),/Invalid UTF-8 source file/);
 fs.writeFileSync(f.source(relativeFiles[0]),original);fs.writeFileSync(f.source('localization.info'),Buffer.from([0xff]));assert.throws(()=>collectTranslation(f.repo),/Invalid UTF-8 source file/);
 fs.writeFileSync(f.source('localization.info'),'{language {code "pt_br"} {steamLanguageCode "brazilian"}}');fs.writeFileSync(f.english(relativeFiles[0]),Buffer.from([0xff]));assert.throws(()=>collectTranslation(f.repo),/Invalid UTF-8 source file/);
});
test('PT-BR metadata requires correct unique game and Steam language keys',t=>{
 const f=fixture(t);
 for(const text of ['{language {code "en"} {steamLanguageCode "brazilian"}}','{language {code "pt_br"} {steamLanguageCode "english"}}','{language {code "pt_br"}}','{language {code "pt_br"} {code "pt_br"} {steamLanguageCode "brazilian"}}','{language\n; {code "pt_br"}\n{steamLanguageCode "brazilian"}}']){fs.writeFileSync(f.source('localization.info'),text);assert.throws(()=>collectTranslation(f.repo),/Invalid PT-BR localization.info/);}
 for(const name of ['Brasil; Português','}','{','// literal; # texto']){fs.writeFileSync(f.source('localization.info'),'{language\n// {code "en"}\n{code "pt_br"} {steamLanguageCode "brazilian"} {name '+JSON.stringify(name)+'}\n}');assert.equal(collectTranslation(f.repo).length,3);}
});
test('metadata properties must be direct children of one balanced language block',t=>{
 const f=fixture(t);
 for(const text of ['{language} {code "pt_br"} {steamLanguageCode "brazilian"}','{language {dummy {code "pt_br"} {steamLanguageCode "brazilian"}}}','{language {code "pt_br"} {steamLanguageCode "brazilian"}','{language {code "pt_br"} {steamLanguageCode "brazilian"}} }','{language {code "pt_br"} {steamLanguageCode "brazilian"}} {dummy 0}','{language {code {value "pt_br"}} {steamLanguageCode "brazilian"}}','{language {code "pt_br"} {steamLanguageCode "brazilian"}} /* unfinished']){fs.writeFileSync(f.source('localization.info'),text);assert.throws(()=>collectTranslation(f.repo),/PT-BR localization.info/);}
});
test('CRC corruptions are detected even when both headers agree',t=>{
 const f=fixture(t),zip=encodeZip(f.entries),r=records(zip)[0];both(zip,r,14,16,(zip.readUInt32LE(r.local+14)^1)>>>0);assert.throws(()=>verifyZip(zip,f.entries),/CRC32/);
});
test('local/central CRC, size, method and date disagreements are rejected',t=>{
 const f=fixture(t),clean=encodeZip(f.entries),r=records(clean)[0];
 for(const [offset,size] of [[16,4],[20,4],[24,4],[10,2],[12,2],[14,2]]){const zip=Buffer.from(clean),field=r.central+offset;zip[size===4?'writeUInt32LE':'writeUInt16LE'](zip[size===4?'readUInt32LE':'readUInt16LE'](field)^1,field);assert.throws(()=>verifyZip(zip,f.entries),/metadata mismatch|size mismatch|compression method/);}
});
test('malformed central and local names must agree byte-for-byte',t=>{
 const f=fixture(t),zip=encodeZip(f.entries),r=records(zip)[0];renameRecord(zip,r,r.name.replace('aa.pot','zz.pot'),{central:false});assert.throws(()=>verifyZip(zip,f.entries),/Local\/central path mismatch/);
});
test('duplicate names and case-insensitive collisions are rejected',t=>{
 const f=fixture(t),clean=encodeZip(f.entries),list=records(clean);
 for(const name of [list[0].name,list[0].name.replace('aa.pot','AA.pot')]){const zip=Buffer.from(clean);renameRecord(zip,list[1],name);assert.throws(()=>verifyZip(zip,f.entries),/Duplicate ZIP entry name/);}
 assert.throws(()=>encodeZip([...f.entries,f.entries[0]]),/Duplicate ZIP name/);
});
test('path traversal, Windows separators, absolute and directory entries are rejected',t=>{
 for(const name of ['../file.pot','/default/file.pot','default/../file.pot','default/a/./b.pot','default/a\\b.pot','default/C:/file.pot','default//file.pot','default/a/','default/a.pot\x00'])assert.throws(()=>safeArchiveName(name),/Unsafe archive path/);
 const f=fixture(t),zip=encodeZip(f.entries),r=records(zip)[0],name='default/../file.pot'.padEnd(r.nameLength,'x');renameRecord(zip,r,name);assert.throws(()=>verifyZip(zip,f.entries),/Unsafe archive path/);
});
test('missing, extra and unknown archive files are rejected',t=>{
 const f=fixture(t);assert.throws(()=>verifyZip(encodeZip(f.entries.slice(1)),f.entries),/inventory count mismatch/);
 assert.throws(()=>verifyZip(encodeZip([...f.entries,{name:'default/extra.pot',bytes:Buffer.from('extra')}]),f.entries),/inventory count mismatch/);
 const replacement=f.entries.map((e,i)=>i===0?{...e,name:e.name.replace('aa.pot','zz.pot')}:e);assert.throws(()=>verifyZip(encodeZip(replacement),f.entries),/Unexpected archive file/);
});
test('stale bytes with a valid CRC cannot pass content verification',t=>{
 const f=fixture(t),stale=f.entries.map(e=>({...e,bytes:Buffer.from(e.bytes)}));stale[0].bytes[stale[0].bytes.length-1]^=1;assert.throws(()=>verifyZip(encodeZip(stale),f.entries),/Stale\/content byte mismatch/);
 buildTranslation(f.repo);const original=fs.readFileSync(f.output),current=fs.readFileSync(f.source(relativeFiles[0]));current[current.length-1]^=1;fs.writeFileSync(f.source(relativeFiles[0]),current);assert.throws(()=>checkTranslation(f.repo),/Stale\/content byte mismatch/);assert.deepEqual(fs.readFileSync(f.output),original);
});
test('encrypted, unsupported methods and streaming/ZIP64 flags are rejected',t=>{
 const f=fixture(t),clean=encodeZip(f.entries),r=records(clean)[0];
 for(const flag of [1,0x40,8,0x20]){const zip=Buffer.from(clean);both(zip,r,6,8,0x800|flag,2);assert.throws(()=>verifyZip(zip,f.entries),/Encrypted|Unsupported ZIP flags/);}
 const method=Buffer.from(clean);both(method,r,8,10,99,2);assert.throws(()=>verifyZip(method,f.entries),/compression method/);
 const zip64=Buffer.from(clean);zip64.writeUInt32LE(0xffffffff,r.central+20);assert.throws(()=>verifyZip(zip64,f.entries),/Unsupported classical ZIP entry/);
});
test('directory and symlink attributes cannot masquerade as files',t=>{
 const f=fixture(t),clean=encodeZip(f.entries),r=records(clean)[0];for(const attrs of [0x10,0xa0000000,0x40000000]){const zip=Buffer.from(clean);zip.writeUInt32LE(attrs,r.central+38);assert.throws(()=>verifyZip(zip,f.entries),/Directory\/symlink/);}
});
test('truncated archives, trailing bytes, directory gaps and overlapping local records fail',t=>{
 const f=fixture(t),clean=encodeZip(f.entries),list=records(clean);
 assert.throws(()=>verifyZip(clean.subarray(0,clean.length-1),f.entries),/end record/);assert.throws(()=>verifyZip(Buffer.concat([clean,Buffer.from('junk')]),f.entries),/end record/);
 const directory=Buffer.from(clean);directory.writeUInt32LE(directory.readUInt32LE(directory.length-22+16)+1,directory.length-22+16);assert.throws(()=>verifyZip(directory,f.entries),/directory layout/);
 const overlap=Buffer.from(clean);overlap.writeUInt32LE(list[0].local,list[1].central+42);assert.throws(()=>verifyZip(overlap,f.entries),/metadata mismatch|path mismatch/);
});
test('deflate corruption and hidden compressed-tail bytes are rejected',t=>{
 const f=fixture(t),clean=encodeZip(f.entries,{method:8}),list=records(clean),r=list[0],bad=Buffer.from(clean);bad.fill(0xff,r.payload,r.payload+Math.min(5,bad.readUInt32LE(r.central+20)));assert.throws(()=>verifyZip(bad,f.entries),/deflate data|CRC32/);
 // Turn the first byte of the next local header into an unused compressed tail;
 // inflated content is unchanged, but declared compressed stream must consume it.
 const tail=Buffer.from(clean),size=tail.readUInt32LE(r.central+20);both(tail,r,18,20,size+1);assert.throws(()=>verifyZip(tail,f.entries),/Trailing bytes in deflate stream/);
});
test('output writes stay under repository/dist and require a .pak filename',t=>{
 const f=fixture(t);for(const output of ['default.pak','../escape.pak',path.join(f.outside,'escape.pak'),'dist/../escape.pak','dist/file.zip','dist/sub/file.pak:stream','dist/space /file.pak'])assert.throws(()=>resolveOutput(f.repo,output),/contained|Unsafe output/);
 assert.equal(resolveOutput(f.repo,'dist/sub/custom.pak').target,path.join(f.repo,'dist','sub','custom.pak'));assert.equal(fs.existsSync(path.join(f.repo,'dist')),false);assert.equal(fs.existsSync(path.join(f.outside,'escape.pak')),false);
});
test('dist symlink/junction to outside cannot redirect writes',t=>{
 const f=fixture(t);fs.symlinkSync(f.outside,path.join(f.repo,'dist'),'junction');assert.throws(()=>buildTranslation(f.repo),/Symlink/);assert.equal(fs.existsSync(path.join(f.outside,'default.pak')),false);
});
test('nested output symlink/junction and source symlink/junction are rejected',t=>{
 const f=fixture(t);fs.mkdirSync(path.join(f.repo,'dist'));fs.symlinkSync(f.outside,path.join(f.repo,'dist','redirect'),'junction');assert.throws(()=>buildTranslation(f.repo,{output:'dist/redirect/file.pak'}),/Symlink/);
 fs.symlinkSync(f.outside,f.source('linked'),'junction');assert.throws(()=>collectTranslation(f.repo),/Symlink in pt_BR/);assert.equal(fs.existsSync(path.join(f.outside,'file.pak')),false);
});
test('source ancestor symlink/junction cannot point outside repository',t=>{
 const f=fixture(t);fs.renameSync(path.join(f.repo,'localization'),path.join(f.outside,'localization'));fs.symlinkSync(path.join(f.outside,'localization'),path.join(f.repo,'localization'),'junction');assert.throws(()=>collectTranslation(f.repo),/Symlink path/);
});
test('check is read-only; CLI default repo is cwd; invalid arguments fail',t=>{
 const f=fixture(t);assert.throws(()=>checkTranslation(f.repo),/ENOENT/);assert.equal(fs.existsSync(path.join(f.repo,'dist')),false);
 const built=JSON.parse(execFileSync(process.execPath,[script,'--repo',f.repo,'--build'],{encoding:'utf8'}));assert.equal(built.files,3);
 const before=fs.readFileSync(f.output),checked=JSON.parse(execFileSync(process.execPath,[script,'--check'],{cwd:f.repo,encoding:'utf8'}));assert.equal(checked.mode,'check');assert.deepEqual(before,fs.readFileSync(f.output));
 assert.equal(parseArguments([]).mode,'check');assert.equal(parseArguments([]).repo,process.cwd());
 for(const args of [['--repo'],['--wat'],['--build','--check'],['--repo','one','--repo','two'],['--output','dist/a.pak','--output','dist/b.pak']])assert.throws(()=>parseArguments(args),/Missing value|Unknown argument|Choose exactly|Duplicate/);
});
