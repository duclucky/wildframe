const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),folder=process.argv[3]||'generated';
 if(!/^[a-z-]+$/.test(folder))throw new Error('Invalid asset folder');
 const directory=path.join(root,'assets',folder);
 const records=JSON.parse(await fs.readFile(process.argv[2]||path.join(root,'qa','generated-image-inputs.json'),'utf8'));
 await fs.mkdir(path.join(directory,'originals'),{recursive:true});
 const manifest=[];
 for(const record of records){
  const original=path.join(directory,'originals',record.slug+'.png');
  try{await fs.access(original)}catch{await fs.copyFile(record.source,original)}
  await sharp(original).resize({width:760,withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(path.join(directory,record.slug+'-thumb.webp'));
  await sharp(original).webp({quality:92,effort:5}).toFile(path.join(directory,record.slug+'-full.webp'));
  const meta=await sharp(original).metadata();
  manifest.push({id:'ai-'+record.slug,title:record.title,place:(record.place||'Imagined landscape')+' · AI study',note:record.note,category:record.category,style:record.style,tags:record.tags,source:'AI-generated',thumb:'assets/'+folder+'/'+record.slug+'-thumb.webp',full:'assets/'+folder+'/'+record.slug+'-full.webp',original:'assets/'+folder+'/originals/'+record.slug+'.png',width:meta.width,height:meta.height,prompt:record.prompt,generation:'Built-in ImageGen',generated:'2026-10-17'});
 }
 await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const sizes=await Promise.all(manifest.map(async r=>({thumb:(await fs.stat(path.join(root,r.thumb))).size,full:(await fs.stat(path.join(root,r.full))).size})));
 console.log(JSON.stringify({images:manifest.length,thumbnailBytes:sizes.reduce((n,r)=>n+r.thumb,0),fullBytes:sizes.reduce((n,r)=>n+r.full,0)}));
})().catch(error=>{console.error(error);process.exitCode=1});
