sphereRecipes.forEach((recipe,i)=>{
 const y=1-i/(sphereRecipes.length-1)*2,r=Math.sqrt(Math.max(0,1-y*y)),angle=i*Math.PI*(3-Math.sqrt(5)),x=Math.cos(angle)*r,z=Math.sin(angle)*r;vectors.push({x,y,z,lat:Math.asin(y)/radians,lon:Math.atan2(x,z)/radians});
 const card=document.createElement('div');card.className='sphere-card';card.dataset.id=recipe.id;card.tabIndex=-1;card.setAttribute('role','button');card.setAttribute('aria-label','View recipe: '+recipe.title);const figure=document.createElement('figure'),image=document.createElement('img');image.alt=recipe.subject;image.draggable=false;image.width=480;image.height=320;image.decoding='async';figure.append(image);card.append(figure);orb.append(card);sphereCards.push(card);
});
function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame)}
function layout(force=false){
 const w=innerWidth,h=innerHeight;if(!force&&w===lastWidth&&h===lastHeight)return;lastWidth=w;lastHeight=h;
 const controls=$('.atlas-controls').getBoundingClientRect();
 const top=Math.max($('header').getBoundingClientRect().bottom+8,controls.left<w/2&&controls.right>w/2?controls.bottom+8:0);
 const bottom=$('.hero-cta').getBoundingClientRect().top-8;
 // Leave room for perspective and tangent cards, with the whole atlas in view.
 R=Math.max(44,Math.min(360,h*.36,w*.44,(bottom-top)/2/1.08));
 root.style.setProperty('--sphere-y',((top+bottom)/2)+'px');
 root.style.setProperty('--cw',Math.round(Math.max(68,R*(w<=640?.39:.42)))+'px');
 perspective=w<=380?620:w<=640?760:w<=900?920:1150;root.style.setProperty('--persp',perspective+'px');
 sphereCards.forEach((card,i)=>{const v=vectors[i];card.style.transform=`translate3d(${v.x*R}px,${-v.y*R}px,${v.z*R}px) rotateY(${v.lon}deg) rotateX(${v.lat}deg)`});renderStamp='';wake();
}
function frame(time){
 raf=0;const dt=lastFrame?clamp((time-lastFrame)/16.667,.25,2):1;lastFrame=time;const paused=sphereLocked||!recipeView.hidden;
 if(!pointer&&!paused){
  if(reduced.matches)velocityX=velocityY=0;
  if(hoverAim){const follow=1-Math.exp(-dt*16.667/(reduced.matches?85:115));yaw+=(hoverAim.yaw-yaw)*follow;pitch+=(hoverAim.pitch-pitch)*follow;if(Math.abs(hoverAim.yaw-yaw)<.01&&Math.abs(hoverAim.pitch-pitch)<.01){yaw=hoverAim.yaw;pitch=hoverAim.pitch;hoverAim=null}}
  else{const decay=Math.pow(.94,dt),travel=(1-decay)/.06;yaw+=velocityX*travel;pitch+=velocityY*travel;velocityX*=decay;velocityY*=decay;if(Math.abs(velocityX)<.002)velocityX=0;if(Math.abs(velocityY)<.002)velocityY=0}
 }
 const bounded=clamp(pitch,-32,32);if(bounded!==pitch)velocityY=0;pitch=bounded;
 const stamp=[pitch.toFixed(4),yaw.toFixed(4),R,activeId].join('|');
 if(stamp!==renderStamp){renderStamp=stamp;world.style.transform=`translateZ(0px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;const sinX=Math.sin(pitch*radians),cosX=Math.cos(pitch*radians),sinY=Math.sin(yaw*radians),cosY=Math.cos(yaw*radians);vectors.forEach((v,i)=>{const zf=-v.x*sinY+(-v.y*sinX+v.z*cosX)*cosY,base=.14+.86*Math.pow(clamp((zf+1)/2,0,1),.85);let dim=1-base;if(activeId)dim=Math.min(.95,dim+.72);const value=dim.toFixed(3);if(sphereCards[i]._d!==value){sphereCards[i].style.setProperty('--d',value);sphereCards[i]._d=value}})}
 if(!paused&&(hoverAim||Math.abs(velocityX)>0||Math.abs(velocityY)>0))wake();else lastFrame=0;
}
function followMouse(event){
 if(event.pointerType!=='mouse'||event.buttons||sphereLocked||stage.inert)return;
 const current={x:event.clientX,y:event.clientY};
 if(hoverPoint){const dx=current.x-hoverPoint.x,dy=current.y-hoverPoint.y;if(dx||dy){const aim={yaw:(hoverAim?.yaw??yaw)+dx*.16,pitch:clamp((hoverAim?.pitch??pitch)-dy*.12,-32,32)};
  // Dampen only deliberate input, with a shorter settling time for reduced motion.
  hoverAim=aim;
  velocityX=velocityY=0;wake()}}
 hoverPoint=current;
}
stage.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hoverPoint={x:event.clientX,y:event.clientY}});
stage.addEventListener('pointerleave',()=>{hoverPoint=null});
stage.addEventListener('pointermove',event=>{if(!pointer)followMouse(event)});
stage.addEventListener('pointerdown',event=>{if(event.button!==0||pointer||activeId)return;resetHoverMotion();pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,time:event.timeStamp,card:document.elementFromPoint(event.clientX,event.clientY)?.closest('.sphere-card')||null,touch:event.pointerType==='touch',decided:event.pointerType!=='touch',distance:0};velocityX=velocityY=0;if(!sphereLocked)stage.classList.add('dragging');if(!pointer.touch){stage.setPointerCapture(event.pointerId);event.preventDefault()}});
stage.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer.distance=Math.max(pointer.distance,Math.hypot(dx,dy));if(pointer.touch&&!pointer.decided){if(pointer.distance<10)return;pointer.decided=true;stage.setPointerCapture(event.pointerId)}if(sphereLocked)return;const vx=(event.clientX-pointer.lastX)*.13,vy=-(event.clientY-pointer.lastY)*.13,dt=Math.max(8,event.timeStamp-pointer.time)/16.667;yaw+=vx;pitch=clamp(pitch+vy,-32,32);velocityX=clamp(vx/dt,-4,4);velocityY=clamp(vy/dt,-4,4);pointer.lastX=event.clientX;pointer.lastY=event.clientY;pointer.time=event.timeStamp;wake()});
function endPointer(event,cancel=false){if(!pointer||pointer.id!==event.pointerId)return;const start=pointer;pointer=null;stage.classList.remove('dragging');if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);if(cancel||reduced.matches||sphereLocked||event.timeStamp-start.time>100)velocityX=velocityY=0;if(!cancel&&start.distance<(coarse.matches?14:6)&&start.card){velocityX=velocityY=0;openRecipe(start.card.dataset.id,start.card)}wake()}
stage.addEventListener('pointerup',event=>endPointer(event));stage.addEventListener('pointercancel',event=>endPointer(event,true));stage.addEventListener('lostpointercapture',event=>endPointer(event,true));
addEventListener('blur',()=>{resetHoverMotion();velocityX=velocityY=0});
addEventListener('resize',()=>layout());addEventListener('orientationchange',()=>setTimeout(()=>layout(true),220));if(window.visualViewport)visualViewport.addEventListener('resize',()=>layout());document.fonts?.ready.then(()=>layout(true));document.addEventListener('visibilitychange',()=>{resetHoverMotion();if(document.hidden){cancelAnimationFrame(raf);raf=0;lastFrame=0;velocityX=velocityY=0}else wake()});reduced.addEventListener('change',()=>{resetHoverMotion();velocityX=velocityY=0;wake()});
let loaded=0;const queue=sphereRecipes.map((recipe,i)=>i).sort((a,b)=>vectors[b].z-vectors[a].z);
function loadThumbnailSource(recipe){
 if(!thumbnailLoads.has(recipe.id))thumbnailLoads.set(recipe.id,new Promise(resolve=>{
  const image=new Image();image.decoding='async';let settled=false;
  const finish=()=>{if(settled)return;settled=true;clearTimeout(timer);thumbs.set(recipe.id,recipe.thumb);resolve(recipe.thumb)};
  const timer=setTimeout(finish,8000);image.onload=finish;image.onerror=finish;image.src=recipe.thumb;
 }));
 return thumbnailLoads.get(recipe.id);
}
async function loadThumbnail(i){
 const recipe=sphereRecipes[i],url=await loadThumbnailSource(recipe),cardImage=sphereCards[i].querySelector('img');
 await new Promise(resolve=>{const finish=()=>{cardImage.classList.add('ready');resolve()};cardImage.onload=finish;cardImage.onerror=finish;cardImage.src=url;if(cardImage.complete)finish()});
 loaded++;if(loaded===sphereRecipes.length)updateAtlasHint();else $('#loadNote').textContent=`${loaded} / ${sphereRecipes.length} food previews ready`;
}
async function thumbnailWorker(){while(queue.length)await loadThumbnail(queue.shift())}
initializeSphereControls();layout(true);handleRoute();for(let i=0;i<4;i++)thumbnailWorker();
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0});addEventListener('pageshow',()=>{layout(true);wake()});
