const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),output=path.resolve(root,'dist');
 if(path.dirname(output)!==root||path.basename(output)!=='dist')throw Error('Invalid build output');
 await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
 const publicFiles=['index.html','kitchen/index.html'];
 const common=['table.css','table-presets.css','cooking.css','table-walnut.webp','ingredients-atlas.webp','ingredients-world-atlas.webp','favicon.svg','logo-savor-atlas.svg','fonts/BeVietnamPro-Regular.ttf','fonts/BeVietnamPro-SemiBold.ttf','fonts/BeVietnamPro-OFL.txt','icons/rotate.svg','icons/shopping-bag.svg','icons/chevron-right.svg','icons/clock.svg','icons/menu.svg','icons/chevron-left.svg'];
 const {dishes}=JSON.parse(await fs.readFile(path.join(root,'source/recipes.json'),'utf8'));
 for(const dish of dishes){if(!/^[a-z0-9-]+$/.test(dish.id)||dish.image!==dish.id+'.webp')throw Error('Invalid recipe image');common.push(dish.image,'globe-'+dish.id+'.webp')}
 publicFiles.push(...common.map(name=>'assets/cooking/'+name));
 for(const name of publicFiles){const dest=path.join(output,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(root,name),dest)}
 console.log('Built '+publicFiles.length+' public files. Source, tests, QA and credentials excluded.');
})().catch(error=>{console.error(error);process.exitCode=1});
