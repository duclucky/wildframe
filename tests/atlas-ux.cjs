const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const recipes=[...require('../assets/prompt-catalog.json'),...require('../assets/atlas-recipes.json'),...require('../assets/visual-experiments.json').recipes];
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const errors=[],passed=[];
 const watch=page=>{page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);return page};
 const pose=page=>page.locator('#world').evaluate(e=>e.style.transform);
 const settle=page=>page.waitForFunction(()=>{const value=document.querySelector('#world').style.transform;if(window.lastPose!==value){window.lastPose=value;window.lastMove=performance.now();return false}return performance.now()-window.lastMove>450});
 const hit=page=>page.evaluate(()=>{for(const card of document.querySelectorAll('.sphere-card')){const r=card.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(x>120&&x<innerWidth-120&&y>220&&y<innerHeight-260&&document.elementFromPoint(x,y)?.closest('.sphere-card')===card)return {x,y,id:card.dataset.id}}});
 try{
  if(!process.env.UX_CASE||process.env.UX_CASE==='sphere'){
   const page=watch(await browser.newPage({viewport:{width:1440,height:1000}}));await page.goto(base);
   assert.equal(await page.locator('#lockSphere').count(),1,'The atlas must expose a view-lock control');
   await page.locator('#lockSphere').click();assert.equal(await page.locator('#lockSphere').getAttribute('aria-pressed'),'true');const frozen=await pose(page);
   await page.mouse.move(450,500);await page.mouse.move(950,450,{steps:20});await settle(page);assert.equal(await pose(page),frozen);
   await page.locator('#lockSphere').click();await page.mouse.move(400,500);await page.mouse.move(950,500,{steps:20});await settle(page);assert.notEqual(await pose(page),frozen);
   await page.locator('#resetSphere').click();await settle(page);assert.match(await pose(page),/rotateY\(0deg\) rotateX\(-4deg\)/);
   passed.push('Lock freezes mouse rotation, unlock restores it, and reset returns to the initial angle');
   await page.locator('#lockSphere').click();const target=await hit(page);assert.ok(target);await page.mouse.move(target.x,target.y);
   await page.locator('#spherePreview:not([hidden])').waitFor();assert.equal(await page.locator('#spherePreviewTitle').textContent(),recipes.find(r=>r.id===target.id).title);
   assert.equal(await page.locator('#promptDialog').evaluate(e=>e.inert),true);assert.equal(await page.locator('.sphere-card.is-previewed').getAttribute('data-id'),target.id);
   await page.screenshot({path:'qa/wildframe-atlas-preview.png'});await page.mouse.click(target.x,target.y);assert.ok(page.url().includes(target.id));
   assert.equal(await page.locator('#spherePreview').isVisible(),false);await page.keyboard.press('Escape');
   passed.push('Stationary hover previews the actual image and its style; a single click opens that exact prompt');
   await page.locator('#lockSphere').click();await page.locator('#stage').focus();const keyboardBefore=await pose(page);await page.keyboard.press('ArrowRight');await settle(page);assert.notEqual(await pose(page),keyboardBefore);
   const keyboardId=await page.locator('.sphere-card.is-previewed').getAttribute('data-id');await page.keyboard.press('Enter');assert.ok(page.url().includes(keyboardId));await page.keyboard.press('Escape');
   await page.emulateMedia({reducedMotion:'reduce'});const reduced=await pose(page);await page.mouse.move(400,550);await page.mouse.move(950,450,{steps:16});await settle(page);assert.equal(await pose(page),reduced);
   passed.push('Keyboard exploration and opening work; reduced motion continues to disable mouse-follow');await page.close();
  }
  if(!process.env.UX_CASE||process.env.UX_CASE==='library'){
   const page=watch(await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}));await page.goto(base);await page.locator('#browsePrompts').click();
   await page.locator('[data-category="Landscapes"]').click();await page.locator('#styleFilter').selectOption('Ink wash');await page.locator('#promptSearch').fill('bamboo');
   assert.equal(await page.locator('#activeFilters button').count(),3,'Each active filter needs its own remove control');
   await page.getByRole('button',{name:'Remove search filter: bamboo',exact:true}).click();assert.equal(await page.locator('#promptSearch').inputValue(),'');assert.equal(await page.locator('#styleFilter').inputValue(),'Ink wash');assert.equal(await page.locator('[data-category="Landscapes"]').getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Remove style filter: Ink wash',exact:true}).click();assert.equal(await page.locator('#styleFilter').inputValue(),'All');assert.equal(await page.locator('[data-category="Landscapes"]').getAttribute('aria-pressed'),'true');
   await page.locator('#clearFilters').click();await page.locator('#library').evaluate(e=>e.scrollTop=1000);
   const discovery=await page.locator('#libraryDiscovery').boundingBox(),header=await page.locator('header').boundingBox();assert.ok(discovery.y>=header.y+header.height&&discovery.y<header.y+header.height+10,'Sticky search toolbar must sit directly below the header');
   const card=page.locator('.open-recipe').nth(18);await card.scrollIntoViewIfNeeded();const id=await card.getAttribute('data-id');await card.click();const scroll=await page.locator('#library').evaluate(e=>e.scrollTop);
   await page.locator('#promptClose').click();assert.ok(Math.abs(await page.locator('#library').evaluate(e=>e.scrollTop)-scroll)<2);assert.equal(await card.evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('.recipe-card.last-viewed').getAttribute('data-id'),id);
   await page.screenshot({path:'qa/wildframe-library-sticky.png'});
   passed.push('Individual filter removal preserves other filters; sticky search and close-to-card scroll/focus restoration work');await page.close();
  }
  if(!process.env.UX_CASE||process.env.UX_CASE==='mobile'){
   const page=watch(await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'}));await page.goto(base);
   const lock=await page.locator('#lockSphere').boundingBox();assert.ok(lock&&lock.width>=44&&lock.height>=44);await page.locator('#lockSphere').tap();assert.equal(await page.locator('#lockSphere').getAttribute('aria-pressed'),'true');
   await page.waitForFunction(()=>[...document.querySelectorAll('.sphere-card img')].every(e=>e.complete&&e.naturalWidth));await page.screenshot({path:'qa/wildframe-atlas-controls-mobile.png'});
   const frozen=await pose(page),cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y:300}]});
   for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:280-i*22,y:300}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await pose(page),frozen);assert.equal(await page.locator('#promptDialog').evaluate(e=>e.inert),true);
   const target=await page.evaluate(()=>{for(const card of document.querySelectorAll('.sphere-card')){const r=card.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(x>30&&x<innerWidth-30&&y>220&&y<innerHeight-240&&document.elementFromPoint(x,y)?.closest('.sphere-card')===card)return {x,y,id:card.dataset.id}}});assert.ok(target);await page.touchscreen.tap(target.x,target.y);await page.waitForURL(url=>url.hash==='#prompt='+target.id);await page.locator('#promptClose').tap();
   passed.push('Locked touch dragging does not rotate or open a prompt; tapping still opens the selected image');
   await page.locator('#browsePrompts').tap();await page.locator('[data-category="Landscapes"]').tap();await page.locator('#styleFilter').selectOption('Photography');
   for(const viewport of [{width:320,height:740},{width:375,height:812},{width:768,height:1024},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.locator('#library').evaluate(e=>e.scrollTop=800);const search=await page.locator('#promptSearch').boundingBox();
    const header=await page.locator('header').boundingBox(),discovery=await page.locator('#libraryDiscovery').boundingBox();assert.ok(discovery.y>=header.y+header.height&&discovery.y<header.y+header.height+10&&search.y+search.height<viewport.height,`Sticky search directly below header at ${viewport.width}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.querySelector('#library').scrollWidth>innerWidth),false,`No overflow at ${viewport.width}`);
   }
   await page.setViewportSize({width:375,height:812});await page.screenshot({path:'qa/wildframe-library-sticky-mobile.png'});
   passed.push('Touch controls have 44px targets and sticky filters fit phone, tablet and landscape layouts');await page.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
