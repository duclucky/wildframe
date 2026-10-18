// Pointer previews use one short dwell timer, never a permanent animation loop.
let sphereLocked=false,previewCard=null,previewTimer=0,previewPoint=null,libraryReturn=null,lastViewedId=null;

function hideSpherePreview(){
 clearTimeout(previewTimer);previewTimer=0;previewPoint=null;
 previewCard?.classList.remove('is-previewed');previewCard=null;
 $('#orb').classList.remove('previewing');$('#spherePreview').hidden=true;
}
function showSpherePreview(card,keyboard=false){
 if(!card||stage.inert)return;
 const recipe=byId.get(card.dataset.id);if(!recipe)return;
 previewCard?.classList.remove('is-previewed');previewCard=card;card.classList.add('is-previewed');$('#orb').classList.add('previewing');
 $('#spherePreviewTitle').textContent=recipe.title;$('#spherePreviewMeta').textContent=recipe.category+' / '+recipe.style;
 $('#spherePreviewHint').textContent=keyboard?'Arrow keys to turn · Enter to open':'Click the image to explore its prompt';
 const image=$('#spherePreviewImage');image.src=thumbs.get(recipe.id)||recipe.thumb;image.hidden=false;image.onerror=()=>{image.hidden=true};
 $('#spherePreview').hidden=false;
 if(keyboard)$('#sphereStatus').textContent=recipe.title+'. '+recipe.style+'. Press Enter to open the prompt.';
}
function queueSpherePreview(event){
 hideSpherePreview();
 if(event.pointerType!=='mouse'||event.buttons||pointer||stage.inert)return;
 previewPoint={x:event.clientX,y:event.clientY};
 const reveal=()=>{
  previewTimer=0;if(!previewPoint||stage.inert||pointer)return;
  // Resolve the image after the camera settles: it may have moved under the cursor.
  if(hoverAim){previewTimer=setTimeout(reveal,80);return}
  const card=document.elementFromPoint(previewPoint.x,previewPoint.y)?.closest('.sphere-card');
  showSpherePreview(card);
 };
 previewTimer=setTimeout(reveal,220);
}
function frontSphereCard(){
 const sinX=Math.sin(pitch*radians),cosX=Math.cos(pitch*radians),sinY=Math.sin(yaw*radians),cosY=Math.cos(yaw*radians);
 let index=0,depth=-Infinity;
 vectors.forEach((v,i)=>{const z=-v.x*sinY+(-v.y*sinX+v.z*cosX)*cosY;if(z>depth){depth=z;index=i}});
 return sphereCards[index];
}
function updateSphereControls(){
 $('#lockSphere').setAttribute('aria-pressed',sphereLocked);
 $('#lockSphereLabel').textContent=sphereLocked?'Unlock view':'Lock view';
 $('#lockSphere use').setAttribute('href',sphereLocked?'#icon-lock':'#icon-unlock');
 stage.classList.toggle('view-locked',sphereLocked);updateAtlasHint();
}
function updateAtlasHint(){
 if(loaded<sphereRecipes.length)return;
 $('#loadNote').textContent=sphereLocked?'View locked · Select an image, or unlock to turn':coarse.matches?'Drag to explore · Tap an image for its prompt':'Move your mouse to explore · Click an image for its prompt';
}
function initializeAtlasUx(){
 $('#lockSphere').addEventListener('click',()=>{
  sphereLocked=!sphereLocked;resetHoverMotion();hideSpherePreview();velocityX=velocityY=0;updateSphereControls();wake();
  $('#sphereStatus').textContent=sphereLocked?'View locked. Images remain available to open.':'View unlocked.';
 });
 $('#resetSphere').addEventListener('click',()=>{
  resetHoverMotion();hideSpherePreview();velocityX=velocityY=0;yaw=0;pitch=-4;renderStamp='';wake();
  $('#sphereStatus').textContent='Initial angle restored.'+(sphereLocked?' View remains locked.':'');
 });
 stage.addEventListener('pointermove',queueSpherePreview);
 stage.addEventListener('pointerleave',hideSpherePreview);stage.addEventListener('pointerdown',hideSpherePreview);
 stage.addEventListener('focus',()=>{resetHoverMotion();velocityX=velocityY=0;showSpherePreview(frontSphereCard(),true)});
 stage.addEventListener('blur',hideSpherePreview);
 stage.addEventListener('keydown',event=>{
  if(event.target!==stage||event.altKey||event.ctrlKey||event.metaKey||stage.inert)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
   event.preventDefault();if(sphereLocked){$('#sphereStatus').textContent='View locked. Use Unlock view to turn the atlas.';return}
   resetHoverMotion();velocityX=velocityY=0;
   if(event.key==='ArrowLeft')yaw-=12;if(event.key==='ArrowRight')yaw+=12;
   if(event.key==='ArrowUp')pitch=clamp(pitch+10,-32,32);if(event.key==='ArrowDown')pitch=clamp(pitch-10,-32,32);
   wake();showSpherePreview(frontSphereCard(),true);
  }else if(event.key==='Enter'||event.key===' '){event.preventDefault();const card=previewCard||frontSphereCard();openPrompt(card.dataset.id,stage)}
  else if(event.key==='Escape')hideSpherePreview();
 });
 addEventListener('blur',hideSpherePreview);addEventListener('resize',hideSpherePreview);
 document.addEventListener('visibilitychange',hideSpherePreview);
 reduced.addEventListener('change',()=>{hideSpherePreview();updateAtlasHint()});
 const discovery=$('#libraryDiscovery'),header=$('header');
 const measure=()=>{
  const top=Math.ceil(header.getBoundingClientRect().bottom)+6;
  root.style.setProperty('--library-top',top+'px');
  library.style.scrollPaddingTop=top+Math.ceil(discovery.getBoundingClientRect().height)+16+'px';
 };
 if('ResizeObserver' in window){const observer=new ResizeObserver(measure);observer.observe(header);observer.observe(discovery)}
 addEventListener('resize',measure);measure();
}

function renderFilterChips(){
 const items=[],query=$('#promptSearch').value.trim();
 if(query)items.push({key:'search',label:query,remove:()=>$('#promptSearch').value='',fallback:$('#promptSearch')});
 if(category!=='All')items.push({key:'category',label:category,remove:()=>category='All',fallback:$('[data-category="All"]')});
 if(style!=='All')items.push({key:'style',label:style,remove:()=>{style='All';$('#styleFilter').value='All'},fallback:$('#styleFilter')});
 if(savedOnly)items.push({key:'collection',label:'Saved',remove:()=>{savedOnly=false;$('#savedNav').setAttribute('aria-current',false);$('#libraryNav').setAttribute('aria-current',true)},fallback:$('#savedNav')});
 const list=$('#activeFilters');list.replaceChildren();list.hidden=!items.length;
 items.forEach((item,index)=>{
  const button=document.createElement('button'),text=document.createElement('span'),close=document.createElement('span');
  button.className='filter-chip';button.setAttribute('aria-label','Remove '+item.key+' filter: '+item.label);button.title=item.label;
  text.textContent=item.label;close.textContent='×';close.setAttribute('aria-hidden','true');button.append(text,close);
  button.addEventListener('click',()=>{item.remove();renderLibrary();const remaining=$$('#activeFilters button');(remaining[Math.min(index,remaining.length-1)]||item.fallback).focus({preventScroll:true})});
  list.append(button);
 });
}
function rememberLibraryPosition(){
 libraryReturn=library.classList.contains('open')?{top:library.scrollTop,id:activeId}:null;
}
function restoreLibraryPosition(){
 if(!library.classList.contains('open')||!libraryReturn)return;
 lastViewedId=libraryReturn.id;
 $$('.recipe-card').forEach(card=>card.classList.toggle('last-viewed',card.dataset.id===lastViewedId));
 library.scrollTop=libraryReturn.top;libraryReturn=null;
}
