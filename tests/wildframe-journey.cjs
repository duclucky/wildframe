const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
  assert.equal(await page.locator('#startJourney').count(),1,'The first-use entry point must be visible');
  await page.locator('#startJourney').click();assert.match(await page.locator('#journeyTitle').textContent(),/Choose a look/);
  await page.locator('#experimentB').selectOption('ai-experiment-fox-ink-wash');await page.locator('#journeyNext').click();
  assert.match(await page.locator('#promptTitle').textContent(),/Ink wash/);assert.match(await page.locator('#journeyTitle').textContent(),/Understand/);
  await page.locator('#journeyNext').click();assert.equal(await page.locator('#dnaPanel').isVisible(),true);
  await page.locator('#journeyNext').click();assert.equal(await page.locator('#studioStyle').inputValue(),'Ink wash');
  await page.locator('#studioSubject').fill('a white deer');await page.locator('#variationName').fill('Deer in ink');
  assert.doesNotMatch(await page.locator('#journeyTitle').textContent(),/saved/i);await page.locator('#saveVariation').click();assert.match(await page.locator('#journeyTitle').textContent(),/saved/i);
  await page.locator('#journeyNext').click();await page.locator('#studioLight').fill('a cool blue dawn');await page.locator('#variationName').fill('Blue dawn');await page.locator('#saveVariation').click();await page.locator('#journeyNext').click();
  assert.equal(await page.locator('#journeyPanel').count(),0);assert.ok(await page.locator('#versionComparison mark').count());
  passed.push('First-use path connects style choice, DNA, real editing, two persisted saves and comparison');
  await page.reload();await page.locator('#customizePrompt').click();assert.equal(await page.locator('[data-restore-version]').count(),2);
  await page.locator('#studioClose').click();await page.locator('#promptClose').click();await page.locator('#startJourney').click();await page.locator('#journeySkip').click();
  assert.equal(await page.locator('#journeyPanel').count(),0);assert.equal(await page.locator('#experiments').evaluate(e=>e.inert),false);await page.keyboard.press('Escape');
  passed.push('Versions survive reload and skipping leaves the ordinary interface available');
  const mobile=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');await mobile.screenshot({path:'qa/wildframe-first-use-mobile.png'});await mobile.locator('#startJourney').tap();
  assert.equal(await mobile.evaluate(()=>document.querySelector('#experiments').scrollWidth>innerWidth),false);
  await mobile.screenshot({path:'qa/wildframe-guide-mobile.png'});await mobile.locator('#journeyNext').tap();await mobile.locator('#journeyNext').tap();await mobile.locator('#journeyNext').tap();
  assert.equal(await mobile.evaluate(()=>document.querySelector('#studio').scrollWidth>innerWidth),false);
  passed.push('The optional guided path fits a small touch screen');
  const denied=await browser.newPage({reducedMotion:'reduce'});denied.on('pageerror',e=>errors.push(e.message));await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}}));
  await denied.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');await denied.locator('#startJourney').click();await denied.locator('#journeyNext').click();await denied.locator('#journeyNext').click();await denied.locator('#journeyNext').click();await denied.locator('#saveVariation').click();
  assert.doesNotMatch(await denied.locator('#journeyTitle').textContent(),/saved/i);assert.match(await denied.locator('#studioStatus').textContent(),/unavailable|kept/);
  passed.push('Failed persistence never reports tutorial completion');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
