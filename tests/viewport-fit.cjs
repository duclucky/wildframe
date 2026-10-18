const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],passed=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
  for(const viewport of [{width:1440,height:1000},{width:1366,height:768},{width:1280,height:720},{width:614,height:630},{width:375,height:812},{width:320,height:568},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>new Promise(requestAnimationFrame));
   const inspect=()=>page.evaluate(()=>{const cards=[...document.querySelectorAll('.sphere-card')].map(e=>e.getBoundingClientRect()),cta=document.querySelector('.hero-cta').getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect();return {height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,innerHeight,innerWidth,top:Math.min(...cards.map(r=>r.top)),bottom:Math.max(...cards.map(r=>r.bottom)),left:Math.min(...cards.map(r=>r.left)),right:Math.max(...cards.map(r=>r.right)),ctaTop:cta.top,ctaBottom:cta.bottom,headerBottom:header.bottom,scroll:scrollY}});
   const check=state=>{assert.ok(state.height<=state.innerHeight,`No vertical page overflow at ${viewport.width}×${viewport.height}`);assert.ok(state.width<=state.innerWidth);assert.ok(state.top>=state.headerBottom&&state.bottom<state.ctaTop-4,`Whole sphere fits between header and actions at ${viewport.width}×${viewport.height}: ${JSON.stringify(state)}`);assert.ok(state.left>=4&&state.right<=state.innerWidth-4);assert.ok(state.ctaBottom<=state.innerHeight);assert.equal(state.scroll,0)};
   check(await inspect());await page.mouse.move(viewport.width*.25,viewport.height*.45);await page.mouse.move(viewport.width*.75,viewport.height*.55,{steps:12});
   await page.waitForFunction(()=>{const pose=document.querySelector('#world').style.transform;if(window.lastFitPose!==pose){window.lastFitPose=pose;window.lastFitMove=performance.now();return false}return performance.now()-window.lastFitMove>150});check(await inspect());
   await page.mouse.wheel(0,800);await page.evaluate(()=>new Promise(requestAnimationFrame));assert.equal(await page.evaluate(()=>scrollY),0);
   await page.screenshot({path:`qa/wildframe-fit-${viewport.width}x${viewport.height}.png`});passed.push(`${viewport.width}×${viewport.height}: whole sphere and actions fit, mouse control works, page does not scroll`);
  }
  await page.locator('#browsePrompts').click();await page.locator('#library').evaluate(e=>e.scrollTop=600);assert.ok(await page.locator('#library').evaluate(e=>e.scrollTop>0));assert.equal(await page.evaluate(()=>scrollY),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,libraryBrowsing:'pass',errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
