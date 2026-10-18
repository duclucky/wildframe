'use strict';
const $=s=>document.querySelector(s),root=document.documentElement,stage=$('#stage'),world=$('#world'),orb=$('#orb');
const recipeView=$('#recipeView'),recipeFrame=$('#recipeFrame');
const reduced=window.SavorAtlasMotion,coarse=matchMedia('(pointer:coarse)'),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),radians=Math.PI/180;
const recipes=recipeData.dishes.map(d=>({...d,title:d.name,subject:d.name,thumb:'assets/cooking/globe-'+d.id+'.webp'}));
const byId=new Map(recipes.map(d=>[d.id,d]));
const sphereRecipes=Array.from({length:60},(_,i)=>recipes[(i*5+Math.floor(i/12))%12]);
const vectors=[],sphereCards=[],thumbs=new Map(),blobURLs=[];
let R=300,perspective=1150,yaw=0,pitch=-4,velocityX=0,velocityY=0,pointer=null,raf=0,lastFrame=0,lastWidth=0,lastHeight=0,renderStamp='',activeId=null;
let hoverPoint=null,hoverAim=null,sphereLocked=false,previewCard=null,previewTimer=0,previewPoint=null;
let viewReady=false,frameStarted=false,pendingDish=null,returnFocus=null;
function resetHoverMotion(){hoverPoint=null;hoverAim=null}
function setHomeInert(inert){stage.inert=inert;$('header').inert=inert;$('.hero-cta').inert=inert;$('#atlasOptions').inert=inert;$('#skipMenu').inert=inert}
function openRecipe(id=null,trigger=null,{route=true}={}){
 if(id&&!byId.has(id))return;
 if(recipeView.hidden)returnFocus=trigger||document.activeElement;
 activeId=id;pendingDish=id;resetHoverMotion();hideSpherePreview();velocityX=velocityY=0;$('#atlasOptions').open=false;
 recipeView.hidden=false;recipeView.inert=false;document.body.classList.add('recipe-view');setHomeInert(true);
 if(route){const hash=id?'#dish='+encodeURIComponent(id):'#menu';if(location.hash!==hash)history.pushState(null,'',hash)}
 if(!frameStarted){frameStarted=true;recipeFrame.src='kitchen/index.html'+(id?'?dish='+encodeURIComponent(id):'')}
 else if(viewReady){recipeFrame.contentWindow.postMessage({type:'savor-atlas:select',id},location.origin);recipeFrame.focus()}
 wake();
}
function closeRecipes({route=true}={}){
 if(recipeView.hidden)return;
 recipeView.hidden=true;recipeView.inert=true;document.body.classList.remove('recipe-view');setHomeInert(false);activeId=null;
 if(route&&location.hash)history.pushState(null,'',location.pathname+location.search);
 resetHoverMotion();velocityX=velocityY=0;layout(true);wake();
 (returnFocus?.isConnected&&!returnFocus.closest('[inert]')?returnFocus:$('#browseRecipes')).focus({preventScroll:true});
}
function handleRoute(){
 const hash=new URLSearchParams(location.hash.slice(1));
 if(location.hash==='#menu')openRecipe(null,null,{route:false});
 else if(hash.has('dish')){const id=hash.get('dish');if(byId.has(id))openRecipe(id,null,{route:false});else{closeRecipes({route:false});history.replaceState(null,'',location.pathname+location.search);$('#sphereStatus').textContent='That recipe could not be found. Choose another dish to explore.'}}
 else closeRecipes({route:false});
}
addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==recipeFrame.contentWindow||!event.data||typeof event.data!=='object')return;
 if(event.data.type==='savor-atlas:ready'){
  viewReady=true;$('#viewLoading').hidden=true;$('#loadingBack').hidden=true;
  if(!recipeView.hidden){recipeFrame.contentWindow.postMessage({type:'savor-atlas:select',id:pendingDish},location.origin);recipeFrame.focus()}
 }else if(event.data.type==='savor-atlas:home')closeRecipes();
 else if(event.data.type==='savor-atlas:selected'&&!recipeView.hidden&&byId.has(event.data.id)){
  activeId=event.data.id;history.replaceState(null,'','#dish='+encodeURIComponent(activeId));
 }
});
$('#browseRecipes').addEventListener('click',()=>openRecipe(null,$('#browseRecipes')));
$('#skipMenu').addEventListener('click',e=>{e.preventDefault();openRecipe(null,$('#skipMenu'))});
$('#homeLink').addEventListener('click',e=>{e.preventDefault();closeRecipes()});
$('#loadingBack').addEventListener('click',()=>closeRecipes());
addEventListener('hashchange',handleRoute);addEventListener('popstate',handleRoute);
function hideSpherePreview(){clearTimeout(previewTimer);previewTimer=0;previewPoint=null;previewCard?.classList.remove('is-previewed');previewCard=null;orb.classList.remove('previewing');$('#spherePreview').hidden=true}
function showSpherePreview(card,keyboard=false){
 if(!card||stage.inert)return;const recipe=byId.get(card.dataset.id);if(!recipe)return;
 previewCard?.classList.remove('is-previewed');previewCard=card;card.classList.add('is-previewed');orb.classList.add('previewing');
 $('#spherePreviewTitle').textContent=recipe.name;$('#spherePreviewMeta').textContent=recipe.country+' · '+recipe.time;
 $('#spherePreviewHint').textContent=keyboard?'Arrow keys to turn · Enter to open':'Select a dish to discover its recipe';
 $('#spherePreviewImage').src=recipe.thumb;$('#spherePreview').hidden=false;
 if(keyboard)$('#sphereStatus').textContent=recipe.name+'. '+recipe.time+'. Press Enter to open the recipe.';
}
function queueSpherePreview(event){
 hideSpherePreview();if(event.pointerType!=='mouse'||event.buttons||pointer||stage.inert)return;previewPoint={x:event.clientX,y:event.clientY};
 const reveal=()=>{previewTimer=0;if(!previewPoint||stage.inert||pointer)return;if(hoverAim){previewTimer=setTimeout(reveal,80);return}showSpherePreview(document.elementFromPoint(previewPoint.x,previewPoint.y)?.closest('.sphere-card'))};previewTimer=setTimeout(reveal,220);
}
function frontSphereCard(){const sx=Math.sin(pitch*radians),cx=Math.cos(pitch*radians),sy=Math.sin(yaw*radians),cy=Math.cos(yaw*radians);let index=0,depth=-Infinity;vectors.forEach((v,i)=>{const z=-v.x*sy+(-v.y*sx+v.z*cx)*cy;if(z>depth){depth=z;index=i}});return sphereCards[index]}
function updateAtlasHint(){if(loaded<sphereRecipes.length)return;$('#loadNote').textContent='';$('#loadNote').hidden=true}
function initializeSphereControls(){
 const options=$('#atlasOptions');
 const closeOptions=(focus=false)=>{options.open=false;if(focus)$('#atlasOptionsToggle').focus({preventScroll:true})};
 $('#lockSphere').addEventListener('click',()=>{sphereLocked=!sphereLocked;resetHoverMotion();hideSpherePreview();velocityX=velocityY=0;$('#lockSphere').setAttribute('aria-pressed',sphereLocked);$('#lockSphere').textContent=sphereLocked?'Unlock view':'Lock view';closeOptions(true);wake()});
 $('#resetSphere').addEventListener('click',()=>{resetHoverMotion();hideSpherePreview();velocityX=velocityY=0;yaw=0;pitch=-4;renderStamp='';closeOptions(true);wake()});
 options.addEventListener('toggle',()=>{if(options.open){hideSpherePreview();resetHoverMotion();velocityX=velocityY=0}});
 document.addEventListener('click',e=>{if(options.open&&!options.contains(e.target))closeOptions()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&options.open){e.preventDefault();closeOptions(true)}});
 stage.addEventListener('pointermove',queueSpherePreview);stage.addEventListener('pointerleave',hideSpherePreview);stage.addEventListener('pointerdown',hideSpherePreview);
 stage.addEventListener('focus',()=>{resetHoverMotion();velocityX=velocityY=0;showSpherePreview(frontSphereCard(),true)});stage.addEventListener('blur',hideSpherePreview);
 stage.addEventListener('keydown',e=>{
  if(e.target!==stage||e.altKey||e.ctrlKey||e.metaKey||stage.inert)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();if(sphereLocked)return;resetHoverMotion();velocityX=velocityY=0;
   if(e.key==='ArrowLeft')yaw-=12;if(e.key==='ArrowRight')yaw+=12;if(e.key==='ArrowUp')pitch=clamp(pitch+10,-32,32);if(e.key==='ArrowDown')pitch=clamp(pitch-10,-32,32);wake();showSpherePreview(frontSphereCard(),true);
  }else if(e.key==='Enter'||e.key===' '){e.preventDefault();openRecipe((previewCard||frontSphereCard()).dataset.id,stage)}else if(e.key==='Escape')hideSpherePreview();
 });
 addEventListener('blur',hideSpherePreview);addEventListener('resize',hideSpherePreview);document.addEventListener('visibilitychange',hideSpherePreview);
}
