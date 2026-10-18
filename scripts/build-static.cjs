// Only explicitly selected public artifacts are copied to Vercel's output.
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),output=path.join(root,'dist'),allowed=new Set();
 await fs.mkdir(output,{recursive:true});
 const hostname=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;
 const origin=process.env.SITE_ORIGIN||(hostname?'https://'+hostname:'');
 if(origin&&(!/^https?:\/\//.test(origin)||new URL(origin).origin!==origin))throw Error('Invalid public site origin');
 async function write(name,content){allowed.add(name);await fs.mkdir(path.dirname(path.join(output,name)),{recursive:true});await fs.writeFile(path.join(output,name),content)}
 for(const name of ['index.html','try.html']){
  let html=await fs.readFile(path.join(root,name),'utf8');
  if(origin){html=html.replace('content="/social-preview.png"','content="'+origin+'/social-preview.png"');if(name==='index.html')html=html.replace('</head>','<link rel="canonical" href="'+origin+'/"><meta property="og:url" content="'+origin+'/">\n</head>')}
  await write(name,html);
 }
 for(const name of ['favicon.svg','social-preview.png'])await write(name,await fs.readFile(path.join(root,name)));
 for(const folder of ['generated','landscapes','experiments','atlas'])for(const name of await fs.readdir(path.join(root,'assets',folder))){if(!name.endsWith('.webp'))continue;await write('assets/'+folder+'/'+name,await fs.readFile(path.join(root,'assets',folder,name)))}
 const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const catalog=JSON.parse(await fs.readFile(path.join(root,'assets/prompt-catalog.json'),'utf8'));
 const atlas=JSON.parse(await fs.readFile(path.join(root,'assets/atlas-recipes.json'),'utf8'));
 const experiments=JSON.parse(await fs.readFile(path.join(root,'assets/visual-experiments.json'),'utf8'));
 const generatedCount=[...catalog,...atlas,...experiments.recipes].filter(recipe=>recipe.source==='generated').length;
 const references=catalog.filter(recipe=>recipe.source==='reference').map(recipe=>'<li><a href="'+escape(recipe.full)+'" target="_blank" rel="noopener noreferrer">'+escape(recipe.title)+'</a></li>').join('');
 const license=escape(await fs.readFile(path.join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
 await write('credits.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sources & credits — WildFrame</title><link rel="icon" href="/favicon.svg"><style>body{margin:0;background:#080a08;color:#f2efe6;font:16px/1.8 system-ui}main{max-width:800px;margin:auto;padding:40px 24px}a{color:#d7e6a0}h1,h2{font-family:Georgia,serif;line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.8 monospace;padding:20px;border:1px solid #66725e;border-radius:10px}</style><main><a href="/">← WildFrame</a><h1>Sources & credits</h1><p>WildFrame helps you explore, understand and remix image prompts. It does not generate new images when you edit a prompt.</p><h2>Generated examples</h2><p>'+generatedCount+' images were created with the built-in ImageGen tool. Each generated example includes the exact prompt used. Results can vary between generations.</p><h2>Reference studies</h2><p>20 reference images use the URLs supplied with the starting gallery. Their study prompts were newly written to explore the image and are not the original generation prompts. WildFrame does not claim to be their photographer.</p><ul>'+references+'</ul><h2>Interface adaptations</h2><p>SpotlightCard and FadeContent are adapted from React Bits by David Haz. Full notice:</p><pre>'+license+'</pre></main></html>');
 await write('robots.txt','User-agent: *\nAllow: /\n'+(origin?'Sitemap: '+origin+'/sitemap.xml\n':''));
 if(origin)await write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+origin+'/</loc></url><url><loc>'+origin+'/credits</loc></url></urlset>');
 async function inspect(directory,prefix=''){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isDirectory())await inspect(path.join(directory,entry.name),name+'/');else if(!allowed.has(name))throw Error('Unexpected file in public output: '+name)}}
 await inspect(output);
 console.log('Static output ready: '+allowed.size+' allowlisted files. Source, backups, QA and credentials are excluded.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
