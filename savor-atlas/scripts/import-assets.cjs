// Run once against the audited, extracted ZIP. Only image encoding is performed.
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp');
(async()=>{
 const source=path.resolve(process.argv[2]||''),target=path.resolve(__dirname,'../assets/cooking');
 const names=(await fs.readdir(source)).filter(name=>name.endsWith('.png'));
 for(const name of names){
  const stem=path.basename(name,'.png');
  await sharp(path.join(source,name)).resize({width:1254,withoutEnlargement:true}).webp({quality:88,alphaQuality:95}).toFile(path.join(target,stem+'.webp'));
  if(!['table-walnut','ingredients-atlas'].includes(stem))await sharp(path.join(source,name)).flatten({background:'#e9dfc9'}).resize(760,507,{fit:'cover',position:'centre'}).webp({quality:86}).toFile(path.join(target,'globe-'+stem+'.webp'));
 }
 console.log('Optimized '+names.length+' supplied images and 12 globe thumbnails.');
})().catch(error=>{console.error(error);process.exitCode=1});
