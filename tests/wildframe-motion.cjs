const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.setDefaultTimeout(16000);
 const errors=[],passed=[];mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.addInitScript(()=>{const request=window.requestAnimationFrame;window.__frames=0;window.requestAnimationFrame=callback=>request.call(window,time=>{window.__frames++;callback(time)})});
 try{
  await mobile.goto('http://127.0.0.1:4173');await mobile.waitForFunction(()=>[...document.querySelectorAll('.sphere-card img')].every(image=>image.complete&&image.naturalWidth>0));
  await mobile.screenshot({path:'qa/wildframe-home-mobile.png'});
  const center=await mobile.evaluate(()=>{const a=document.querySelector('#headline .inner').getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return [Math.abs(a.x+a.width/2-s.width/2),Math.abs(a.y+a.height/2-s.height/2)]});assert.ok(center.every(n=>n<1));
  const idle=await mobile.evaluate(()=>new Promise(resolve=>{const before=window.__frames;setTimeout(()=>resolve(window.__frames-before),1000)}));assert.ok(idle<=1);
  const cdp=await mobile.context().newCDPSession(mobile),before=await mobile.locator('#world').getAttribute('style');
  const gesture=async(x,y,ex,ey)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++){await mobile.evaluate(()=>new Promise(requestAnimationFrame));await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(ex-x)*i/8,y:y+(ey-y)*i/8}]})}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  await gesture(300,350,140,365);await mobile.waitForFunction(value=>document.querySelector('#world').getAttribute('style')!==value,before);assert.equal(await mobile.locator('#promptDialog').evaluate(e=>e.inert),true);
  await gesture(190,650,190,320);await mobile.waitForFunction(()=>scrollY>0);assert.ok(await mobile.evaluate(()=>scrollY<=innerHeight*.16+1));
  passed.push('Mobile title centered, camera rests, horizontal drag and vertical scroll');
  await mobile.locator('#browsePrompts').tap();await mobile.locator('[data-category="Landscapes"]').tap();await mobile.waitForFunction(()=>[...document.querySelectorAll('.recipe-card img')].every(image=>image.complete&&image.naturalWidth>0));await mobile.waitForFunction(()=>document.getAnimations().every(animation=>animation.playState!=='running'));await mobile.screenshot({path:'qa/wildframe-library-mobile.png'});
  await mobile.locator('.open-recipe').first().tap();await mobile.waitForFunction(()=>document.querySelector('#promptImage').complete&&document.querySelector('#promptImage').naturalWidth>0);
  const copy=await mobile.locator('#copyMaster').boundingBox();assert.ok(copy.y>=0&&copy.y+copy.height<=844);
  await mobile.screenshot({path:'qa/wildframe-prompt-mobile.png'});await mobile.locator('#customizePrompt').tap();await mobile.screenshot({path:'qa/wildframe-studio-mobile.png'});await mobile.locator('#studioClose').tap();await mobile.locator('#promptClose').tap();
  for(const viewport of [{width:360,height:740},{width:844,height:390}]){await mobile.setViewportSize(viewport);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  passed.push('Copy available on arrival, touch modal navigation and small/landscape layouts');
  const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});desktop.on('pageerror',e=>errors.push(e.message));await desktop.goto('http://127.0.0.1:4173');await desktop.waitForFunction(()=>[...document.querySelectorAll('.sphere-card img')].every(image=>image.complete&&image.naturalWidth>0));await desktop.screenshot({path:'qa/wildframe-home-desktop.png'});
  const hit=await desktop.evaluate(()=>{for(const el of document.querySelectorAll('.sphere-card')){const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(x>80&&x<innerWidth-80&&y>150&&y<innerHeight-180&&document.elementFromPoint(x,y)?.closest('.sphere-card')===el)return {x,y,id:el.dataset.id}}});assert.ok(hit);await desktop.mouse.click(hit.x,hit.y);await desktop.waitForFunction(()=>document.querySelector('#promptDialog').classList.contains('open'));assert.ok((await desktop.url()).includes(hit.id));
  passed.push('Selecting a real sphere card opens the corresponding masterprompt');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,idleAnimationCallbacks:idle,errors},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
