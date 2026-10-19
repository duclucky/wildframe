const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4174';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),errors=[],passed=[];
 try{
  for(const reducedMotion of ['reduce','no-preference']){
   const page=await browser.newPage({viewport:{width:614,height:630},reducedMotion});page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const request=window.requestAnimationFrame;window.appFrames=0;window.requestAnimationFrame=cb=>request.call(window,t=>{window.appFrames++;cb(t)})});
   await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.mouse.move(170,270);await page.mouse.move(370,270);
   const trace=await page.evaluate(()=>new Promise(resolve=>{const trace=[],start=performance.now();function sample(time){const yaw=Number(document.querySelector('#world').style.transform.match(/rotateY\(([-\d.]+)deg\)/)[1]);trace.push({t:time-start,yaw});if(time-start<1100)requestAnimationFrame(sample);else resolve(trace)}requestAnimationFrame(sample)}));
   assert.ok(trace.at(-1).yaw-trace[0].yaw>4);assert.ok(Math.abs(trace.at(-1).yaw-32)<.1);assert.ok(trace.every((v,i)=>!i||v.yaw>=trace[i-1].yaw-.001));
   const idle=await page.evaluate(()=>new Promise(resolve=>{const frames=appFrames;setTimeout(()=>resolve(appFrames-frames),500)}));assert.ok(idle<=1);
   assert.equal(await page.locator('#atlasOptions').count(),0);assert.equal(await page.locator('[data-motion-toggle]').count(),0);
   passed.push(`${reducedMotion}: original sensitivity, smooth deceleration, no overshoot/idle loop, no settings menu`);await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  for(const viewport of [{width:1440,height:1000},{width:1366,height:768},{width:1280,height:720},{width:614,height:630},{width:375,height:812},{width:320,height:568},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>new Promise(requestAnimationFrame));
   const state=await page.evaluate(()=>{const boxes=[...document.querySelectorAll('.sphere-card')].map(e=>e.getBoundingClientRect()),cta=document.querySelector('.hero-cta').getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect();return {height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,innerHeight,innerWidth,top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom)),left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),ctaTop:cta.top,ctaBottom:cta.bottom,headerBottom:header.bottom}});
   assert.ok(state.height<=state.innerHeight&&state.width<=state.innerWidth,JSON.stringify(state));assert.ok(state.top>=state.headerBottom&&state.bottom<state.ctaTop-4,JSON.stringify(state));assert.ok(state.left>=4&&state.right<=state.innerWidth-4,JSON.stringify(state));
   await page.mouse.wheel(0,800);assert.equal(await page.evaluate(()=>scrollY),0);
   await page.screenshot({path:`qa/home-${viewport.width}x${viewport.height}.png`});passed.push(`${viewport.width}×${viewport.height}: whole sphere fits, no page scroll`);
  }
  const touch=await browser.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true,reducedMotion:'reduce'});touch.on('pageerror',e=>errors.push(e.message));await touch.goto(base);await touch.waitForFunction(()=>document.querySelectorAll('.sphere-card img.ready').length===60);
  const hit=await touch.evaluate(()=>{for(const card of document.querySelectorAll('.sphere-card')){const b=card.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;if(y>150&&y<innerHeight-150&&document.elementFromPoint(x,y)?.closest('.sphere-card')===card)return{x,y}}});assert.ok(hit);await touch.touchscreen.tap(hit.x,hit.y);assert.equal(await touch.locator('#recipeView').isVisible(),false);await touch.getByRole('button',{name:'Explore recipes',exact:true}).click();await touch.locator('#recipeView').waitFor({state:'visible'});
  const kitchen=touch.frameLocator('#recipeFrame');await kitchen.locator('#stage').waitFor();await kitchen.locator('#stage').press('Enter');await kitchen.locator('#detail-panel').waitFor({state:'visible'});
  const initial=await kitchen.locator('#recipe-ingredients li strong').first().textContent();await kitchen.locator('#servings').selectOption('4');const doubled=await kitchen.locator('#recipe-ingredients li strong').first().textContent();assert.notEqual(initial,doubled);
  await kitchen.locator('#recipe-ingredients input').first().check();assert.equal(await kitchen.locator('#recipe-ingredients input').first().isChecked(),true);
  await kitchen.locator('#start-cooking').click();await touch.screenshot({path:'qa/cooking-mobile.png'});
  const bounds=await kitchen.locator('#detail-panel').evaluate(el=>({width:el.scrollWidth,client:el.clientWidth,rect:el.getBoundingClientRect().toJSON(),innerWidth,innerHeight}));assert.ok(bounds.width<=bounds.client+1&&bounds.rect.left>=0&&bounds.rect.right<=bounds.innerWidth&&bounds.rect.bottom<=bounds.innerHeight);
  passed.push('Globe tap stays decorative; Explore recipes, servings, checklist and cooking panel work on mobile');
  const normal=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'no-preference'});normal.on('pageerror',e=>errors.push(e.message));await normal.goto(base+'/#dish=teriyaki-salmon');const frame=normal.frameLocator('#recipeFrame');await frame.locator('#stage').waitFor();await normal.screenshot({path:'qa/kitchen-desktop.png'});await frame.locator('#stage').press('Enter');await frame.locator('#detail-panel').waitFor({state:'visible',timeout:10000});await normal.waitForFunction(()=>!document.querySelector('#recipeFrame').contentDocument.querySelector('#dish-dialog').hasAttribute('aria-busy'));await frame.locator('.dialog-close').click();await frame.locator('#dish-dialog').waitFor({state:'hidden',timeout:10000});
  passed.push('Original plate-to-recipe animation and reverse animation complete with normal motion');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
