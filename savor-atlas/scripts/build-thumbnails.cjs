// Preserve the entire plated dish inside each landscape globe tile.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),{dishes}=JSON.parse(await fs.readFile(path.join(root,'source/recipes.json'),'utf8'));
 let before=0,after=0;
 for(const dish of dishes){
  const output=path.join(root,'assets/cooking/globe-'+dish.id+'.webp');before+=(await fs.stat(output)).size;
  await sharp(path.join(root,'assets/cooking',dish.image)).resize(480,320,{fit:'contain',background:'#eee8dc'}).flatten({background:'#eee8dc'}).webp({quality:84}).toFile(output);
  after+=(await fs.stat(output)).size;
 }
 console.log(JSON.stringify({thumbnails:dishes.length,beforeBytes:before,afterBytes:after,composition:'full plate, no crop'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
