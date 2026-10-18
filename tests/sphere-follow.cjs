const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const request=window.requestAnimationFrame;window.__frames=0;window.requestAnimationFrame=callback=>request.call(window,time=>{window.__frames++;callback(time)})});
 const rotation=()=>page.locator('#world').evaluate(element=>{const style=element.style.transform;return {yaw:Number(style.match(/rotateY\(([-\d.]+)deg\)/)?.[1]),pitch:Number(style.match(/rotateX\(([-\d.]+)deg\)/)?.[1])}});
 const settle=()=>page.waitForFunction(()=>{const style=document.querySelector('#world').style.transform;if(window.__lastSphereStyle!==style){window.__lastSphereStyle=style;window.__lastSphereChange=performance.now();return false}return performance.now()-(window.__lastSphereChange||performance.now())>400});
 try{
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>document.querySelector('#world').style.transform);
  await page.mouse.move(450,520);const before=await rotation();await page.mouse.move(900,520,{steps:24});await settle();const right=await rotation();
  assert.ok(right.yaw-before.yaw>=60,'A 450px mouse movement must produce at least 60 degrees of rotation without holding a button');
  await page.mouse.move(900,300,{steps:18});await settle();assert.ok((await rotation()).pitch-right.pitch>=20);assert.equal(await page.locator('#promptDialog').evaluate(e=>e.inert),true);
  passed.push('Horizontal and vertical pointer movement rotate the sphere without a mouse button or accidental recipe opening');
  const idle=await page.evaluate(()=>new Promise(resolve=>{const frames=window.__frames;setTimeout(()=>resolve(window.__frames-frames),800)}));assert.ok(idle<=1);
  passed.push('The camera settles when the pointer stops; no continuous idle animation');
  await page.locator('#browsePrompts').click();const paused=await rotation();await page.mouse.move(300,500,{steps:15});assert.deepEqual(await rotation(),paused);
  await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(400,550);const reduced=await rotation();await page.mouse.move(850,550,{steps:15});await settle();assert.ok((await rotation()).yaw-reduced.yaw>=60,'Reduced motion must retain the increased sensitivity without holding a button');
  const reducedIdle=await page.evaluate(()=>new Promise(resolve=>{const frames=window.__frames;setTimeout(()=>resolve(window.__frames-frames),600)}));assert.ok(reducedIdle<=1,'Reduced motion must not leave an idle animation running');
  passed.push('Library overlays pause the effect; reduced motion keeps shorter, smooth settling with no idle animation');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(700,500);await page.mouse.move(850,450,{steps:12});await settle();
  await page.mouse.move(130,40);await settle();
  const hit=await page.evaluate(()=>{for(const element of document.querySelectorAll('.sphere-card')){const box=element.getBoundingClientRect(),x=box.x+box.width/2,y=box.y+box.height/2;if(x>120&&x<innerWidth-120&&y>200&&y<innerHeight-240&&document.elementFromPoint(x,y)?.closest('.sphere-card')===element)return {x,y}}});assert.ok(hit);
  await page.mouse.move(hit.x,hit.y);await settle();
  const current=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('.sphere-card')?.dataset.id,hit);
  assert.ok(current,'A visible image remains selectable after mouse-follow movement');await page.mouse.down();await page.mouse.up();assert.match(page.url(),new RegExp(current));
  passed.push('A click still opens the image under the pointer after automatic rotation');
  const hybrid=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true});hybrid.on('pageerror',e=>errors.push(e.message));await hybrid.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
  assert.equal(await hybrid.evaluate(()=>matchMedia('(pointer:coarse)').matches),true);
  await hybrid.mouse.move(400,500);const hybridBefore=await hybrid.locator('#world').getAttribute('style');await hybrid.mouse.move(900,500,{steps:20});await hybrid.waitForFunction(before=>document.querySelector('#world').getAttribute('style')!==before,hybridBefore);await hybrid.close();
  passed.push('A real mouse also controls a touch-capable device with a coarse primary pointer');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,yawDegreesFor450px:right.yaw-before.yaw,idleAnimationCallbacks:idle,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
