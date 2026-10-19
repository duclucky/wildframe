const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4174';await page.goto(base+'/#menu');
  const frame=page.frameLocator('#recipeFrame');await frame.locator('#dish-name').waitFor();
  assert.equal(await frame.locator('[data-motion-toggle]').count(),0,'Kitchen controls belong outside the removed header');
  assert.equal(await page.locator('html').getAttribute('data-motion'),'full','A fresh visit must enable motion even when the OS requests reduced motion');
  assert.notEqual(await frame.locator('#wheel').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  assert.equal(await page.locator('#atlasOptions').count(),0,'The home has no settings menu');
  await page.locator('#viewLoading').waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.documentElement.dataset.motion==='full');
  assert.equal(await frame.locator('html').getAttribute('data-motion'),'full');
  assert.notEqual(await frame.locator('#wheel').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await frame.locator('.dish-card').nth(1).click();
  await frame.locator('#wheel').evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>resolve(e.getAnimations().length)))).then(count=>assert.ok(count>0,'The table must visibly animate despite reduced-motion at OS level'));
  await frame.locator('#wheel').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
  await frame.locator('#next').click();await page.waitForFunction(()=>{const track=document.querySelector('#recipeFrame').contentDocument.querySelector('#menu-track');return track.classList.contains('is-paging')&&track.getAnimations({subtree:true}).length>=8});
  await page.waitForFunction(()=>!document.querySelector('#recipeFrame').contentDocument.querySelector('#menu-track').classList.contains('is-paging'));
  passed.push('A fresh visit enables table rotation and staggered menu slides despite reduced motion at OS level');
  await frame.locator('#stage').press('Enter');
  await page.waitForFunction(()=>document.querySelector('#recipeFrame').contentDocument.querySelector('#flying-plate').getAnimations({subtree:true}).length>0);
  assert.equal(await frame.locator('#detail-panel').isVisible(),false,'The plate must fly and spin before the recipe expands');
  await frame.locator('#detail-panel').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('#recipeFrame').contentDocument.querySelector('#dish-dialog').hasAttribute('aria-busy'));
  await frame.locator('.dialog-close').click();
  await page.waitForFunction(()=>document.querySelector('#recipeFrame').contentDocument.querySelector('#dish-dialog').getAnimations({subtree:true}).some(a=>a.playState==='running'));
  await frame.locator('#dish-dialog').waitFor({state:'hidden'});
  passed.push('Plate flight, spinning, recipe expansion and reverse close transition all run');
  await page.reload();await frame.locator('#dish-name').waitFor();assert.equal(await frame.locator('html').getAttribute('data-motion'),'full');
  await page.evaluate(()=>localStorage.setItem('savor-atlas:motion:v1','reduced'));await page.reload();await frame.locator('#dish-name').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-motion'),'full','Legacy reduced-motion preferences must not disable effects');
  assert.equal(await frame.locator('html').getAttribute('data-motion'),'full');
  assert.notEqual(await frame.locator('#wheel').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  for(const mode of ['no-preference','reduce']){
   await page.emulateMedia({reducedMotion:mode});assert.equal(await page.locator('html').getAttribute('data-motion'),'full');
   assert.equal(await frame.locator('html').getAttribute('data-motion'),'full');
  }
  const standalone=await context.newPage();await standalone.goto(base+'/kitchen/index.html');await standalone.locator('#dish-name').waitFor();
  assert.equal(await standalone.locator('html').getAttribute('data-motion'),'full');
  assert.notEqual(await standalone.locator('#wheel').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await standalone.close();
  passed.push('Full motion persists across reloads, legacy saved preferences, OS changes and standalone kitchen visits');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }catch(error){console.error(JSON.stringify({errors,state:await page.evaluate(()=>{const d=document.querySelector('#recipeFrame')?.contentDocument;return{parentMotion:document.documentElement.dataset.motion,childMotion:d?.documentElement.dataset.motion,focused:d?.activeElement?.id,dialogOpen:d?.querySelector('#dish-dialog')?.open,dialogBusy:d?.querySelector('#dish-dialog')?.getAttribute('aria-busy'),menuClasses:d?.querySelector('#menu-track')?.className,menuBusy:d?.querySelector('#menu-track')?.getAttribute('aria-busy'),title:d?.querySelector('#dish-name')?.textContent}})},null,2));throw error;}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
