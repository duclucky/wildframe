'use strict';
const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)],body=document.body,root=document.documentElement;
const stage=$('#stage'),world=$('#world'),orb=$('#orb'),headline=$('#headline'),library=$('#library'),dialog=$('#promptDialog'),studio=$('#studio'),experiments=$('#experiments');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),coarse=matchMedia('(pointer:coarse)'),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),radians=Math.PI/180;
const libraryRecipes=[...catalog,...atlasRecipes],allRecipes=[...libraryRecipes,...experimentData.recipes],byId=new Map(allRecipes.map(recipe=>[recipe.id,recipe]));
// Spread the extra artworks through the original atlas instead of clustering
// all new styles at one pole of the sphere.
const sphereRecipes=[],sphereExtras=[...atlasRecipes,...experimentData.recipes];
let extraCursor=0;
catalog.forEach((recipe,index)=>{sphereRecipes.push(recipe);const through=Math.round((index+1)*sphereExtras.length/catalog.length);while(extraCursor<through)sphereRecipes.push(sphereExtras[extraCursor++])});
function readStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function writeStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
let saved=new Set();const savedData=readStore('wildframe:saved:v1',readStore('ethan-vale:saved',[]));if(Array.isArray(savedData))saved=new Set(savedData.filter(id=>byId.has(id)));
let category='All',style='All',savedOnly=false,visibleIds=libraryRecipes.map(recipe=>recipe.id),activeId=null,browseIds=[],returnFocus=null,studioSeed=null,toastTimer=0;
const vectors=[],sphereCards=[],thumbs=new Map(),blobURLs=[];
let R=300,perspective=1150,yaw=0,pitch=-4,camZ=0,velocityX=0,velocityY=0,pointer=null,raf=0,lastFrame=0,lastWidth=0,lastHeight=0,renderStamp='',imageToken=0;
let hoverPoint=null,hoverAim=null;
function resetHoverMotion(){hoverPoint=null;hoverAim=null}
const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('aria-hidden','true');use.setAttribute('href','#icon-'+name);svg.append(use);return svg};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function updateSaved(){
 $('#savedCount').textContent=saved.size;
 $('#savedNav').setAttribute('aria-label',`Saved prompts, ${saved.size} items`);
 $$('.save-recipe').forEach(button=>{const on=saved.has(button.dataset.id);button.setAttribute('aria-pressed',on);button.setAttribute('aria-label',(on?'Unsave ':'Save ')+byId.get(button.dataset.id).title)});
 if(activeId){const on=saved.has(activeId);$('#savePrompt').setAttribute('aria-pressed',on);$('#savePrompt').setAttribute('aria-label',on?'Remove this prompt from saved':'Save this prompt')}
}
function toggleSaved(id){if(!byId.has(id))return;const oldPosition=visibleIds.indexOf(id);saved.has(id)?saved.delete(id):saved.add(id);const persisted=writeStore('wildframe:saved:v1',[...saved]);updateSaved();const message=persisted?(saved.has(id)?'Saved to your collection.':'Removed from your saved prompts.'):'Kept for this visit. Browser storage is unavailable.';$('#promptStatus').textContent=message;toast(message);if(savedOnly){renderLibrary();if(!activeId){const remaining=$$('.open-recipe');(remaining[Math.min(Math.max(0,oldPosition),remaining.length-1)]||$('#promptSearch')).focus({preventScroll:true})}}}
function normalize(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function setLibrary(on,{focus=true,onlySaved=savedOnly}={}){
 savedOnly=onlySaved;body.classList.toggle('library-view',on);library.classList.toggle('open',on);
 if(on){renderLibrary();library.scrollTop=0}syncLayers();$('#exploreNav').setAttribute('aria-current',!on);$('#savedNav').setAttribute('aria-current',on&&savedOnly);$('#libraryNav').setAttribute('aria-current',on&&!savedOnly);
 if(focus){if(on)(coarse.matches?$('#libraryTitle'):$('#promptSearch')).focus({preventScroll:true});else $('#browsePrompts').focus({preventScroll:true})}
 wake();
}
function resetFilters(){category='All';style='All';savedOnly=false;$('#promptSearch').value='';$('#styleFilter').value='All';renderLibrary();$('#savedNav').setAttribute('aria-current',false);$('#libraryNav').setAttribute('aria-current',true)}
function renderLibrary(){
 const query=normalize($('#promptSearch').value.trim());const filtered=(savedOnly?allRecipes:libraryRecipes).filter(recipe=>(category==='All'||recipe.category===category)&&(style==='All'||recipe.style===style)&&(!savedOnly||saved.has(recipe.id))&&normalize([recipe.title,recipe.subject,recipe.setting,recipe.category,recipe.style,...recipe.tags].join(' ')).includes(query));
 visibleIds=filtered.map(recipe=>recipe.id);const grid=$('#recipeGrid');grid.replaceChildren();
 for(const recipe of filtered){
  const article=document.createElement('article');article.className='recipe-card';article.dataset.id=recipe.id;
  const media=document.createElement('div');media.className='image-wrap';
  const open=document.createElement('button');open.className='open-recipe';open.dataset.id=recipe.id;open.setAttribute('aria-label','Open masterprompt: '+recipe.title);
  const image=document.createElement('img');image.src=thumbs.get(recipe.id)||recipe.thumb;image.alt=recipe.subject;image.width=760;image.height=507;image.loading='lazy';image.decoding='async';image.addEventListener('error',()=>{image.hidden=true;open.classList.add('preview-unavailable');const fallback=document.createElement('span');fallback.className='preview-message';fallback.textContent='Preview unavailable · Prompt ready to explore';open.append(fallback)},{once:true});open.append(image);open.addEventListener('click',()=>openPrompt(recipe.id,open));
  const badge=document.createElement('span');badge.className='image-tag';badge.textContent=recipe.category;
  const source=document.createElement('span');source.className='source-pin';source.textContent=recipe.source==='generated'?'AI EXAMPLE':'REFERENCE';
  const save=document.createElement('button');save.className='icon-button card-save save-recipe';save.dataset.id=recipe.id;save.setAttribute('aria-pressed',saved.has(recipe.id));save.setAttribute('aria-label','Save '+recipe.title);save.append(icon('bookmark'));save.addEventListener('click',()=>toggleSaved(recipe.id));media.append(open,badge,source,save);
  const info=document.createElement('div');info.className='recipe-info';const copy=document.createElement('button');copy.className='icon-button card-copy';copy.setAttribute('aria-label','Copy masterprompt: '+recipe.title);copy.append(icon('copy'));copy.addEventListener('click',async()=>{if(await copyText(recipe.prompt)){toast('Masterprompt copied.')}else{openPrompt(recipe.id,copy);showCopyFallback(recipe.prompt,'promptCopyFallback')}});
  const text=document.createElement('div'),title=document.createElement('h2'),titleButton=document.createElement('button'),meta=document.createElement('p');titleButton.className='title-button';titleButton.textContent=recipe.title;titleButton.addEventListener('click',()=>openPrompt(recipe.id,titleButton));title.append(titleButton);meta.textContent=recipe.style+' · '+(recipe.source==='generated'?'Generated example':'Reference study');text.append(title,meta);info.append(text,copy);
  const tags=document.createElement('div');tags.className='recipe-tags';recipe.tags.slice(0,3).forEach(tag=>{const span=document.createElement('span');span.textContent=tag;tags.append(span)});article.append(media,info,tags);grid.append(article);
 }
 $$('[data-category]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.category===category));
 $('#resultCount').textContent=filtered.length+' prompt'+(filtered.length===1?'':'s')+(savedOnly?' in your collection':', ready to make your own');
 $('#clearFilters').hidden=!query&&category==='All'&&style==='All'&&!savedOnly;$('#exportSaved').hidden=!savedOnly||!saved.size;
 $('#libraryEyebrow').textContent=savedOnly?'Your collection / Kept close':'The WildFrame Collection / Vol. 01';$('#emptyState').hidden=filtered.length>0;
 $('#libraryTitle').innerHTML=savedOnly?'Your <em>saved prompts.</em>':'Find your next<br><em>what if.</em>';
 $('#emptyTitle').textContent=savedOnly&&!saved.size?'Your collection starts with a spark.':'Nothing in this clearing.';$('#emptyDescription').textContent=savedOnly&&!saved.size?'Tap the bookmark on a prompt you love. It will be waiting here when you come back.':'Try another subject or remove a filter. Your next idea may be one word away.';
 updateSaved();refreshLibraryVisuals();
}
$('#browsePrompts').addEventListener('click',()=>setLibrary(true,{onlySaved:false}));$('#libraryNav').addEventListener('click',()=>setLibrary(true,{onlySaved:false}));$('#savedNav').addEventListener('click',()=>{resetFilters();setLibrary(true,{onlySaved:true})});$('#exploreNav').addEventListener('click',()=>setLibrary(false));$('#homeLink').addEventListener('click',event=>{event.preventDefault();setLibrary(false)});$('#skipLibrary').addEventListener('click',event=>{event.preventDefault();setLibrary(true,{onlySaved:false})});
$$('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;renderLibrary()}));$$('[data-topic]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.topic;style='All';$('#styleFilter').value='All';$('#promptSearch').value='';setLibrary(true,{onlySaved:false})}));$('#promptSearch').addEventListener('input',renderLibrary);$('#styleFilter').addEventListener('change',event=>{style=event.target.value;renderLibrary()});for(const id of ['clearFilters','emptyReset'])$('#'+id).addEventListener('click',()=>{resetFilters();$('#promptSearch').focus({preventScroll:true})});

function syncLayers(){
 const promptOpen=dialog.classList.contains('open'),studioOpen=studio.classList.contains('open'),labOpen=experiments.classList.contains('open'),flat=library.classList.contains('open');
 body.style.overflow=promptOpen||studioOpen||labOpen||flat?'hidden':'';stage.inert=promptOpen||studioOpen||labOpen||flat;library.inert=promptOpen||studioOpen||labOpen||!flat;$('header').inert=promptOpen||studioOpen||labOpen;
 $$('.hero-layer').forEach(element=>element.inert=promptOpen||studioOpen||labOpen||flat);$('#skipLibrary').inert=promptOpen||studioOpen||labOpen;dialog.inert=!promptOpen||studioOpen;studio.inert=!studioOpen;experiments.inert=!labOpen||promptOpen||studioOpen;resetHoverMotion();velocityX=velocityY=0;wake();
 renderJourney();
}
function setRecipeHash(id){history.pushState(null,'','#prompt='+encodeURIComponent(id))}
function openPrompt(id,trigger=null,{route=true,keepBrowse=false}={}){
 if(!byId.has(id))return;activeId=id;returnFocus=trigger||$('#browsePrompts');if(!keepBrowse)browseIds=experiments.classList.contains('open')?groupRecipes().map(recipe=>recipe.id):library.classList.contains('open')?[...visibleIds]:sphereRecipes.map(recipe=>recipe.id);if(!browseIds.includes(id)){const group=experimentData.groups.find(group=>group.variants.includes(id));browseIds=group?[...group.variants]:libraryRecipes.map(recipe=>recipe.id)}
 dialog.classList.add('open');dialog.scrollTop=0;renderPrompt();syncLayers();if(route)setRecipeHash(id);$('#promptClose').focus({preventScroll:true});
}
function renderPrompt(){
 const recipe=byId.get(activeId),token=++imageToken;$('#promptTitle').textContent=recipe.title;$('#promptCategory').textContent=recipe.category+' / '+recipe.style;$('#masterText').value=recipe.prompt;$('#negativeText').textContent=recipe.negative;$('#promptLength').textContent=recipe.prompt.split(/\s+/).length+' words';
 $('#parameterCategory').textContent=recipe.category;$('#parameterStyle').textContent=recipe.style;$('#visualNote').textContent=recipe.description;$('#fullImageLink').href=recipe.full;$('#promptImage').src=thumbs.get(recipe.id)||recipe.thumb;$('#promptImage').alt=recipe.subject;
 $('#visualType').textContent=recipe.source==='generated'?'AI-generated example / ImageGen':'Reference image / Visual study';$('#sourceBadge').textContent=recipe.source==='generated'?'Generated example':'Reference study';$('#sourceNote').textContent=recipe.source==='generated'?'This is the prompt used to generate the example. Each generation can produce a different result.':'This prompt was written to explore the reference image. It is not the original generation prompt.';
 $('#promptStatus').textContent='';$('#promptCopyFallback').hidden=true;$('.negative-box').open=false;$('#promptIndex').textContent=String(browseIds.indexOf(activeId)+1).padStart(2,'0')+' / '+String(browseIds.length).padStart(2,'0');$('#previousPrompt').disabled=$('#nextPrompt').disabled=browseIds.length<2;updateSaved();
 renderDna();
 const full=new Image();full.decoding='async';full.onload=async()=>{try{await full.decode()}catch{}if(token===imageToken&&activeId===recipe.id)$('#promptImage').src=recipe.full};full.onerror=()=>{if(token===imageToken)$('#promptStatus').textContent='The large preview could not load. The masterprompt is ready to copy.'};full.src=recipe.full;
}
function closePrompt({route=true,restore=true}={}){
 if(studio.classList.contains('open'))closeStudio();imageToken++;dialog.classList.remove('open');activeId=null;syncLayers();if(route&&location.hash.startsWith('#prompt='))history.replaceState(null,'',location.pathname+location.search);
 if(restore){let target=returnFocus;if(!target?.isConnected||target.closest('[inert]'))target=library.classList.contains('open')?$('#promptSearch'):$('#browsePrompts');target.focus({preventScroll:true})}
}
function navigatePrompt(direction){if(!activeId||browseIds.length<2)return;const index=browseIds.indexOf(activeId);activeId=browseIds[(index+direction+browseIds.length)%browseIds.length];renderPrompt();dialog.scrollTop=0;history.replaceState(null,'','#prompt='+encodeURIComponent(activeId));if(!dialog.contains(document.activeElement))$('#promptClose').focus({preventScroll:true})}
$('#promptClose').addEventListener('click',()=>closePrompt());$('#previousPrompt').addEventListener('click',()=>navigatePrompt(-1));$('#nextPrompt').addEventListener('click',()=>navigatePrompt(1));dialog.addEventListener('click',event=>{if(event.target===dialog)closePrompt()});$('#savePrompt').addEventListener('click',()=>toggleSaved(activeId));
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{return false}}
function showCopyFallback(text,id){const box=$('#'+id);box.hidden=false;const area=box.querySelector('textarea');area.value=text;area.focus({preventScroll:true});area.select();box.scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'})}
async function copyWithStatus(text,statusId,fallbackId,message){const ok=await copyText(text);$('#'+statusId).textContent=ok?message:'Clipboard access is unavailable. You can select the text below and copy it manually.';if(ok)toast(message);else showCopyFallback(text,fallbackId)}
$('#copyMaster').addEventListener('click',()=>copyWithStatus(byId.get(activeId).prompt,'promptStatus','promptCopyFallback','Masterprompt copied. Make something wild.'));
$('#copyNegative').addEventListener('click',()=>copyWithStatus(byId.get(activeId).negative,'promptStatus','promptCopyFallback','Suggested exclusions copied.'));
$('#sharePrompt').addEventListener('click',()=>{const url=new URL(location.href);url.hash='prompt='+encodeURIComponent(activeId);copyWithStatus(url.href,'promptStatus','promptCopyFallback','Link to this original recipe copied.')});

const styleDirections=PromptLab.styles;
function studioValues(){return {id:studioSeed.id,subject:$('#studioSubject').value.trim(),setting:$('#studioSetting').value.trim(),style:$('#studioStyle').value,ratio:$('#studioRatio').value,light:$('#studioLight').value.trim(),palette:$('#studioPalette').value.trim(),composition:$('#studioComposition').value.trim(),negative:$('#studioNegative').value.trim()}}
function updateStudio(){
 $('#studioOutput').value=PromptLab.compose(studioValues());
 $('#studioStatus').textContent='';$('#studioCopyFallback').hidden=true;
}
function fillStudio(value){$('#studioSubject').value=value.subject||'';$('#studioSetting').value=value.setting||'';$('#studioStyle').value=Object.hasOwn(styleDirections,value.style)?value.style:'Photography';$('#studioRatio').value=['3:2','16:9','1:1','4:5','9:16'].includes(value.ratio)?value.ratio:'3:2';$('#studioLight').value=value.light||'';$('#studioPalette').value=value.palette||'';$('#studioComposition').value=value.composition||'';$('#studioNegative').value=value.negative||'';updateStudio()}
function openStudio(){if(!activeId)return;studioSeed=byId.get(activeId);$('#studioImage').src=thumbs.get(activeId)||studioSeed.thumb;$('#studioImage').alt=studioSeed.subject;$('#studioSourceTitle').textContent=studioSeed.title;studio.classList.add('open');studio.scrollTop=0;fillStudio({...studioSeed,ratio:'3:2'});prepareStudioHistory();syncLayers();$('#studioClose').focus({preventScroll:true})}
function closeStudio(){studio.classList.remove('open');syncLayers();$('#customizePrompt').focus({preventScroll:true})}
$('#customizePrompt').addEventListener('click',openStudio);$('#studioClose').addEventListener('click',closeStudio);studio.addEventListener('click',event=>{if(event.target===studio)closeStudio()});$('#studioForm').addEventListener('submit',event=>event.preventDefault());$('#studioForm').addEventListener('input',updateStudio);$('#studioForm').addEventListener('change',updateStudio);$('#resetStudio').addEventListener('click',()=>fillStudio({...studioSeed,ratio:'3:2'}));
function variationText(){return PromptLab.text(studioValues())}
$('#copyStudio').addEventListener('click',()=>copyWithStatus(variationText(),'studioStatus','studioCopyFallback','Variation copied. Your next image starts here.'));
$('#saveVariation').addEventListener('click',saveRemix);
$('#restoreVariation').addEventListener('click',()=>{const latest=currentVersions()[0];if(latest)restoreRemix(latest)});
function downloadText(text,filename,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#downloadStudio').addEventListener('click',()=>downloadText('WILDFRAME / A PERSONAL VARIATION\nBased on: '+studioSeed.title+'\n\n'+variationText(),'wildframe-'+studioSeed.id+'-variation.txt'));
$('#exportSaved').addEventListener('click',()=>downloadText(JSON.stringify({collection:'WildFrame saved masterprompts',prompts:allRecipes.filter(recipe=>saved.has(recipe.id)).map(({id,title,prompt,negative,category,style})=>({id,title,prompt,negative,category,style}))},null,2),'wildframe-saved-prompts.json','application/json'));

function trap(event,scope){const items=[...scope.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,summary')].filter(element=>element.getClientRects().length&&!element.closest('[inert]'));if(!items.length)return;const index=items.indexOf(document.activeElement);if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===items.length-1){event.preventDefault();items[event.shiftKey?items.length-1:0].focus()}}
addEventListener('keydown',event=>{
 if(event.key==='Escape'){if(studio.classList.contains('open'))closeStudio();else if(dialog.classList.contains('open'))closePrompt();else if(experiments.classList.contains('open'))closeExperiments();else if(library.classList.contains('open'))setLibrary(false)}
 if(event.key==='Tab'){if(studio.classList.contains('open'))trap(event,studio);else if(dialog.classList.contains('open'))trap(event,dialog);else if(experiments.classList.contains('open'))trap(event,experiments)}
 if(dialog.classList.contains('open')&&!studio.classList.contains('open')&&!['TEXTAREA','INPUT','SELECT'].includes(document.activeElement.tagName)&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();navigatePrompt(event.key==='ArrowRight'?1:-1)}
});
function handleRoute(){let id;try{const hash=new URLSearchParams(location.hash.slice(1));id=hash.get('prompt')}catch{}if(id&&byId.has(id)){if(studio.classList.contains('open'))closeStudio();if(activeId!==id)openPrompt(id,null,{route:false})}else{if(dialog.classList.contains('open'))closePrompt({route:false});if(id){setLibrary(true,{focus:false,onlySaved:false});toast('That prompt could not be found. Explore the collection instead.')}}}
addEventListener('hashchange',handleRoute);addEventListener('popstate',handleRoute);

// The original CSS 3D atlas now opens masterprompts instead of field notes.
sphereRecipes.forEach((recipe,i)=>{
 const y=1-i/(sphereRecipes.length-1)*2,r=Math.sqrt(Math.max(0,1-y*y)),angle=i*Math.PI*(3-Math.sqrt(5)),x=Math.cos(angle)*r,z=Math.sin(angle)*r;vectors.push({x,y,z,lat:Math.asin(y)/radians,lon:Math.atan2(x,z)/radians});
 const card=document.createElement('div');card.className='sphere-card';card.dataset.id=recipe.id;card.tabIndex=-1;card.setAttribute('role','button');card.setAttribute('aria-label','Open masterprompt: '+recipe.title);const figure=document.createElement('figure'),image=document.createElement('img');image.alt=recipe.subject;image.draggable=false;figure.append(image);card.append(figure);orb.append(card);sphereCards.push(card);
});
function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame)}
function layout(force=false){const w=innerWidth,h=innerHeight;if(!force&&Math.abs(w-lastWidth)<20&&Math.abs(h-lastHeight)<20)return;lastWidth=w;lastHeight=h;R=Math.max(w<=380?108:w<=640?120:155,Math.min(480,h*(w<=380?.38:w<=640?.42:.46),w*(w<=380?.48:w<=640?.52:.58)));root.style.setProperty('--cw',Math.round(Math.max(68,R*(w<=640?.39:.42)))+'px');perspective=w<=380?620:w<=640?760:w<=900?920:1150;root.style.setProperty('--persp',perspective+'px');sphereCards.forEach((card,i)=>{const v=vectors[i];card.style.transform=`translate3d(${v.x*R}px,${-v.y*R}px,${v.z*R}px) rotateY(${v.lon}deg) rotateX(${v.lat}deg)`});renderStamp='';wake()}
function frame(time){
 raf=0;const dt=lastFrame?clamp((time-lastFrame)/16.667,.25,2):1;lastFrame=time;const paused=library.classList.contains('open')||dialog.classList.contains('open')||studio.classList.contains('open')||experiments.classList.contains('open');
 if(!pointer&&!paused){
  if(reduced.matches){velocityX=velocityY=0;resetHoverMotion()}
  if(hoverAim){const follow=1-Math.pow(.84,dt);yaw+=(hoverAim.yaw-yaw)*follow;pitch+=(hoverAim.pitch-pitch)*follow;if(Math.abs(hoverAim.yaw-yaw)<.005&&Math.abs(hoverAim.pitch-pitch)<.005){yaw=hoverAim.yaw;pitch=hoverAim.pitch;hoverAim=null}}
  else{const decay=Math.pow(.94,dt),travel=(1-decay)/.06;yaw+=velocityX*travel;pitch+=velocityY*travel;velocityX*=decay;velocityY*=decay;if(Math.abs(velocityX)<.002)velocityX=0;if(Math.abs(velocityY)<.002)velocityY=0}
 }
 const bounded=clamp(pitch,-32,32);if(bounded!==pitch)velocityY=0;pitch=bounded;const p=clamp(scrollY/(innerHeight*.16),0,1),target=p*Math.min(64,R*.12);if(!paused){camZ=reduced.matches?target:camZ+(target-camZ)*(1-Math.pow(.925,dt));if(Math.abs(target-camZ)<.01)camZ=target}
 const stamp=[pitch.toFixed(4),yaw.toFixed(4),camZ.toFixed(4),R,p.toFixed(3),activeId].join('|');
 if(stamp!==renderStamp){renderStamp=stamp;world.style.transform=`translateZ(${camZ}px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;headline.style.opacity=1-p*.4;const sinX=Math.sin(pitch*radians),cosX=Math.cos(pitch*radians),sinY=Math.sin(yaw*radians),cosY=Math.cos(yaw*radians);vectors.forEach((v,i)=>{const zf=-v.x*sinY+(-v.y*sinX+v.z*cosX)*cosY,base=.14+.86*Math.pow(clamp((zf+1)/2,0,1),.85);let dim=(1-Math.min(1,p*1.6))*(1-base);if(activeId)dim=Math.min(.95,dim+.72);const value=dim.toFixed(3);if(sphereCards[i]._d!==value){sphereCards[i].style.setProperty('--d',value);sphereCards[i]._d=value}})}
 if(!paused&&(hoverAim||Math.abs(velocityX)>0||Math.abs(velocityY)>0||Math.abs(target-camZ)>.01))wake();else lastFrame=0;
}
function followMouse(event){
 if(event.pointerType!=='mouse'||event.buttons||coarse.matches||reduced.matches||stage.inert)return;
 const current={x:event.clientX,y:event.clientY};
 if(hoverPoint){const dx=current.x-hoverPoint.x,dy=current.y-hoverPoint.y;if(dx||dy){hoverAim={yaw:(hoverAim?.yaw??yaw)+dx*.08,pitch:clamp((hoverAim?.pitch??pitch)-dy*.06,-32,32)};velocityX=velocityY=0;wake()}}
 hoverPoint=current;
}
stage.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hoverPoint={x:event.clientX,y:event.clientY}});
stage.addEventListener('pointerleave',()=>{hoverPoint=null});
stage.addEventListener('pointermove',event=>{if(!pointer)followMouse(event)});
stage.addEventListener('pointerdown',event=>{if(event.button!==0||pointer||activeId)return;resetHoverMotion();pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,time:event.timeStamp,card:event.target.closest('.sphere-card'),touch:event.pointerType==='touch',decided:event.pointerType!=='touch',distance:0};velocityX=velocityY=0;stage.classList.add('dragging');if(!pointer.touch){stage.setPointerCapture(event.pointerId);event.preventDefault()}});
stage.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer.distance=Math.max(pointer.distance,Math.hypot(dx,dy));if(pointer.touch&&!pointer.decided){if(pointer.distance<10)return;if(Math.abs(dy)>Math.abs(dx)*1.15){pointer=null;stage.classList.remove('dragging');return}pointer.decided=true;stage.setPointerCapture(event.pointerId)}const vx=(event.clientX-pointer.lastX)*.13,vy=-(event.clientY-pointer.lastY)*.13,dt=Math.max(8,event.timeStamp-pointer.time)/16.667;yaw+=vx;pitch=clamp(pitch+vy,-32,32);velocityX=clamp(vx/dt,-4,4);velocityY=clamp(vy/dt,-4,4);pointer.lastX=event.clientX;pointer.lastY=event.clientY;pointer.time=event.timeStamp;wake()});
function endPointer(event,cancel=false){if(!pointer||pointer.id!==event.pointerId)return;const start=pointer;pointer=null;stage.classList.remove('dragging');if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);if(cancel||reduced.matches||event.timeStamp-start.time>100)velocityX=velocityY=0;if(!cancel&&start.distance<(coarse.matches?14:6)&&start.card){velocityX=velocityY=0;openPrompt(start.card.dataset.id,start.card)}wake()}
stage.addEventListener('pointerup',event=>endPointer(event));stage.addEventListener('pointercancel',event=>endPointer(event,true));stage.addEventListener('lostpointercapture',event=>endPointer(event,true));
addEventListener('blur',()=>{resetHoverMotion();velocityX=velocityY=0});
addEventListener('scroll',()=>{if(scrollY>innerHeight*.16+1)scrollTo(0,innerHeight*.16);wake()},{passive:true});addEventListener('resize',()=>layout());addEventListener('orientationchange',()=>setTimeout(()=>layout(true),220));if(window.visualViewport)visualViewport.addEventListener('resize',()=>layout());document.addEventListener('visibilitychange',()=>{resetHoverMotion();if(document.hidden){cancelAnimationFrame(raf);raf=0;lastFrame=0;velocityX=velocityY=0}else wake()});reduced.addEventListener('change',()=>{resetHoverMotion();velocityX=velocityY=0;wake()});
function downscale(image,max){if(image.naturalWidth<=max)return Promise.resolve(image.src);return new Promise(resolve=>{try{const canvas=document.createElement('canvas');canvas.width=max;canvas.height=Math.round(image.naturalHeight*max/image.naturalWidth);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(!blob)return resolve(image.src);const url=URL.createObjectURL(blob);blobURLs.push(url);resolve(url)},'image/webp',.86)}catch{resolve(image.src)}})}
let loaded=0;const queue=sphereRecipes.map((recipe,i)=>i).sort((a,b)=>vectors[b].z-vectors[a].z);
async function loadThumbnail(i){return new Promise(resolve=>{const recipe=sphereRecipes[i],image=new Image();image.crossOrigin='anonymous';image.decoding='async';let settled=false;const finish=url=>{if(settled)return;settled=true;clearTimeout(timer);thumbs.set(recipe.id,url);const cardImage=sphereCards[i].querySelector('img');cardImage.onload=()=>cardImage.classList.add('ready');cardImage.src=url;loaded++;$('#loadNote').textContent=loaded===sphereRecipes.length?(coarse.matches||reduced.matches?'Drag to explore the atlas':'Move your mouse to explore · Click an image for its prompt'):`${loaded} / ${sphereRecipes.length} previews ready`;resolve()};const timer=setTimeout(()=>finish(recipe.thumb),8000);image.onload=async()=>finish(await downscale(image,innerWidth<=640?520:760));image.onerror=()=>finish(recipe.thumb);image.src=recipe.thumb})}
async function thumbnailWorker(){while(queue.length)await loadThumbnail(queue.shift())}
initializeVisuals();initializeLab();initializeJourney();layout(true);updateSaved();syncLayers();handleRoute();for(let i=0;i<4;i++)thumbnailWorker();
addEventListener('pagehide',event=>{cancelAnimationFrame(raf);raf=0;if(!event.persisted)blobURLs.forEach(url=>URL.revokeObjectURL(url))});addEventListener('pageshow',()=>{layout(true);wake()});
