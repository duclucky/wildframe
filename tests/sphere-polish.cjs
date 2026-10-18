const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),errors=[],passed=[];
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
 try{
  for(const reducedMotion of ['reduce','no-preference']){
   const page=await browser.newPage({viewport:{width:614,height:630},reducedMotion});page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const request=window.requestAnimationFrame;window.appFrames=0;window.requestAnimationFrame=cb=>request.call(window,t=>{window.appFrames++;cb(t)})});
   await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.mouse.move(170,270);
   await page.mouse.move(370,270);
   const trace=await page.evaluate(()=>new Promise(resolve=>{const trace=[],start=performance.now();function sample(time){const yaw=Number(document.querySelector('#world').style.transform.match(/rotateY\(([-\d.]+)deg\)/)[1]);trace.push({t:time-start,yaw});if(time-start<1100)requestAnimationFrame(sample);else resolve(trace)}requestAnimationFrame(sample)}));
   assert.ok(trace.at(-1).yaw-trace[0].yaw>4,`The sphere must continue gently toward its target after the mouse stops (${reducedMotion})`);
   assert.ok(Math.abs(trace.at(-1).yaw-32)<.1,'Sensitivity remains 0.16 degrees per pixel');
   assert.ok(trace.every((v,i)=>!i||v.yaw>=trace[i-1].yaw-.001),'Settling must not oscillate or overshoot');
   const speeds=trace.slice(1).map((v,i)=>({t:v.t,speed:(v.yaw-trace[i].yaw)/(v.t-trace[i].t)}));
   const mean=values=>values.reduce((sum,v)=>sum+v.speed,0)/values.length;
   assert.ok(mean(speeds.filter(v=>v.t<180))>mean(speeds.filter(v=>v.t>350&&v.t<550))*3,'Rotation decelerates instead of stopping abruptly');
   await page.waitForFunction(()=>{const pose=document.querySelector('#world').style.transform;if(window.lastPose!==pose){window.lastPose=pose;window.lastPoseChange=performance.now();return false}return performance.now()-window.lastPoseChange>200},null,{timeout:2500});
   const idle=await page.evaluate(()=>new Promise(resolve=>{const frames=appFrames;setTimeout(()=>resolve(appFrames-frames),500)}));assert.ok(idle<=1,`Motion must settle without an idle render loop (${reducedMotion})`);
   passed.push(`${reducedMotion}: preserved sensitivity, progressive deceleration, no overshoot or idle animation`);await page.close();
  }
  const page=await browser.newPage({viewport:{width:614,height:630},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  assert.equal(await page.locator('#lockSphere').isVisible(),false,'View tools should be tucked away by default');
  const visibleButtons=await page.locator('button').evaluateAll(buttons=>buttons.filter(e=>e.getClientRects().length&&!e.closest('[inert]')).map(e=>e.id));assert.deepEqual(visibleButtons,['browsePrompts']);
  await page.locator('#atlasOptionsToggle').click();await page.locator('#lockSphere').click();assert.equal(await page.locator('#lockSphere').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#atlasOptions').getAttribute('open'),null);
  await page.locator('#atlasOptionsToggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#atlasOptions').getAttribute('open'),null);assert.equal(await page.locator('#atlasOptionsToggle').evaluate(e=>e===document.activeElement),true);
  await page.locator('#browsePrompts').click();await page.locator('#startJourneyLibrary').click();assert.match(await page.locator('#journeyTitle').textContent(),/Choose a look/);
  passed.push('One quiet home action, collapsible accessible view tools, and the remix guide remains available in the library');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
