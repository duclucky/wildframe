const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4174',root=path.resolve(__dirname,'..');
(async()=>{
 const {dishes}=JSON.parse(await fs.readFile(path.join(root,'source/recipes.json'),'utf8'));const passed=[];
 for(const dish of dishes){
  const file=path.join(root,'assets/cooking/globe-'+dish.id+'.webp'),meta=await sharp(file).metadata();
  assert.ok(meta.hasAlpha,dish.name+': globe thumbnail must retain its transparent background');
  const alpha=await sharp(file).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  assert.ok(alpha[0]===0&&alpha[meta.width-1]===0&&alpha.at(-1)===0,dish.name+': thumbnail corners must be fully transparent');
  assert.ok(alpha.some(value=>value>=250),dish.name+': the plated food must remain opaque after image resampling');
  const resized=await sharp(path.join(root,'assets/cooking',dish.image)).resize(meta.width,meta.height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  const expected=await sharp(resized).flatten({background:'#080a08'}).removeAlpha().raw().toBuffer();
  const actual=await sharp(file).flatten({background:'#080a08'}).removeAlpha().raw().toBuffer();let error=0;for(let i=0;i<actual.length;i++)error+=Math.abs(actual[i]-expected[i]);
  assert.ok(error/actual.length<5,dish.name+': the entire plate must remain visible, not cropped to fill its thumbnail');
 }passed.push('All 12 globe thumbnails preserve the full plate and transparent background');
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const errors=[];
 try{
  for(const [width,height] of [[320,568],[375,812],[390,844],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
   await page.waitForFunction(()=>document.querySelectorAll('.sphere-card img.ready').length===60);
   const tile=await page.locator('.sphere-card').first().evaluate(e=>({background:getComputedStyle(e.querySelector('figure')).backgroundColor,imageBackground:getComputedStyle(e.querySelector('img')).backgroundColor,overlay:getComputedStyle(e.querySelector('figure'),'::after').content}));
   assert.equal(tile.background,'rgba(0, 0, 0, 0)');assert.equal(tile.imageBackground,'rgba(0, 0, 0, 0)');assert.equal(tile.overlay,'none','A rectangular overlay must not cover transparent plate images');
   const before=await page.locator('#world').getAttribute('style');
   const client=await page.context().newCDPSession(page);
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:height*.42}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:height*.42+45}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(old=>document.querySelector('#world').getAttribute('style')!==old,before,{timeout:1500});
   await page.getByRole('button',{name:'Explore recipes',exact:true}).click();const frame=page.frameLocator('#recipeFrame');await frame.locator('#dish-name').waitFor();
   const layout=await frame.locator('body').evaluate(el=>({width:el.scrollWidth,viewport:innerWidth,buttons:[...el.querySelectorAll('.kitchen-actions button,.arrow-button,.pager button')].map(e=>({id:e.id,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
   assert.ok(layout.width<=layout.viewport,width+': kitchen must not overflow horizontally');assert.ok(layout.buttons.every(b=>b.width>=44&&b.height>=44),width+': navigation controls need comfortable touch targets');
   const open=frame.getByRole('button',{name:'View recipe',exact:true});await open.click();await frame.locator('#detail-panel').waitFor({state:'visible'});
   await page.evaluate(()=>document.querySelector('#recipeFrame').contentWindow.postMessage({type:'savor-atlas:select',id:'teriyaki-salmon'},location.origin));
   await page.evaluate(()=>new Promise(requestAnimationFrame));assert.ok(await frame.locator('#detail-panel').isVisible(),'A repeated selection must not close the recipe already being read');
   await frame.locator('#recipe-ingredients input').first().check();await frame.locator('#servings').selectOption('4');assert.ok(await frame.locator('#recipe-ingredients input').first().isChecked(),'Changing servings must preserve the preparation checklist');
   if(width<600)assert.ok(Number(await frame.locator('#servings').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)))>=16,'Mobile select text should avoid automatic input zoom');
   await frame.getByRole('button',{name:'Start cooking →',exact:true}).click();
   const viewport=await frame.locator('#detail-panel').evaluate(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight}});assert.ok(viewport.left>=0&&viewport.right<=viewport.width&&viewport.bottom<=viewport.height);
   passed.push(width+'×'+height+': vertical drag, navigation, explicit recipe CTA, checklist preservation and cooking panel work');await page.close();
  }
  const motion=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});motion.on('pageerror',e=>errors.push(e.message));await motion.goto(base+'/#dish=chicken-pho');
  const kitchen=motion.frameLocator('#recipeFrame');await motion.locator('#viewLoading').waitFor({state:'hidden'});const start=performance.now();await kitchen.getByRole('button',{name:'View recipe',exact:true}).click();
  await motion.waitForFunction(()=>document.querySelector('#recipeFrame').contentDocument.querySelector('#flying-plate').getAnimations({subtree:true}).length>0);
  assert.equal(await kitchen.locator('#detail-panel').isVisible(),false,'Touch motion must retain the plate flight before showing the recipe');
  const flightDurations=await kitchen.locator('#flying-plate').evaluate(e=>e.getAnimations({subtree:true}).map(a=>a.effect.getTiming().duration));assert.ok(flightDurations.every(d=>d>0&&d<=600),'Mobile keeps the choreography with shorter animation timings');
  await kitchen.locator('#detail-panel').waitFor({state:'visible'});await motion.waitForFunction(()=>!document.querySelector('#recipeFrame').contentDocument.querySelector('#dish-dialog').hasAttribute('aria-busy'));const openMs=Math.round(performance.now()-start),closeStart=performance.now();
  await kitchen.getByRole('button',{name:'Close recipe',exact:true}).click();await kitchen.locator('#dish-dialog').waitFor({state:'hidden'});passed.push('Mobile full-motion plate flight and reverse close remain intact');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,mobileAnimationObservedMs:{open:openMs,close:Math.round(performance.now()-closeStart)},errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
