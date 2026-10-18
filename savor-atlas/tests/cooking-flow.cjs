const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4174';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[],failures=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url())});
 try{
  await page.goto(base);assert.match(await page.title(),/world of recipes/i,'Homepage must introduce world recipes in English');
  await page.waitForFunction(()=>document.querySelectorAll('.sphere-card img.ready').length===60);
  const images=await page.locator('.sphere-card img').evaluateAll(items=>items.map(i=>i.getAttribute('src')));
  assert.ok(images.every(src=>src.includes('/cooking/')));assert.equal(new Set(images).size,12);
  const pose=()=>page.locator('#world').getAttribute('style');
  await page.mouse.move(300,300);const before=await pose();await page.mouse.move(650,300,{steps:12});await page.waitForFunction(v=>document.querySelector('#world').getAttribute('style')!==v,before);
  passed.push('60 food cards, 12 unique dishes, mouse-follow rotation retained');
  await page.locator('#stage').focus();await page.keyboard.press('Enter');
  await page.locator('#recipeView').waitFor({state:'visible'});
  const frame=page.frameLocator('#recipeFrame');await frame.locator('.dish-card').first().waitFor();
  assert.match(page.url(),/#dish=/);assert.equal(await page.locator('#stage').evaluate(e=>e.inert),true);
  await frame.locator('#stage').focus();await page.keyboard.press('Enter');
  await frame.locator('#detail-panel').waitFor({state:'visible'});
  assert.ok(await frame.locator('#modal-ingredients li').count()>=4);
  assert.ok(await frame.locator('#recipe-steps li').count()>=4);
  assert.match(await frame.locator('#modal-servings').textContent(),/2/);
  await frame.locator('#start-cooking').click();assert.equal(await frame.locator('#recipe-steps li[aria-current="step"]').count(),1);
  await frame.locator('#next-step').click();assert.equal(await frame.locator('#recipe-steps li[aria-current="step"]').getAttribute('data-step'),'1');
  for(let i=0;i<10;i++){if(await frame.locator('#next-step').isDisabled())break;await frame.locator('#next-step').click()}
  assert.match(await frame.locator('#cooking-status').textContent(),/All done/);
  assert.doesNotMatch(await frame.locator('body').innerText(),/Đặt hàng|masterprompt|đồng|AI-generated/i);
  await page.keyboard.press('Escape');await frame.locator('#dish-dialog').waitFor({state:'hidden'});
  const paused=await pose();await page.mouse.move(1100,500);assert.equal(await pose(),paused);
  await frame.locator('#backToSphere').click();await page.locator('#recipeView').waitFor({state:'hidden'});assert.equal(await page.locator('#stage').evaluate(e=>e.inert),false);
  passed.push('Food opens recipe, ingredients/servings/step-by-step cooking work, return restores sphere');
  await page.goto(base+'/#dish=chicken-pho');await frame.locator('#dish-name').waitFor();assert.equal(await frame.locator('#dish-name').textContent(),'Chicken Pho');
  await frame.locator('.dish-card').nth(3).click();const selected=await frame.locator('#dish-name').textContent();assert.match(page.url(),/#dish=/);
  await page.reload();await frame.locator('#dish-name').waitFor();assert.equal(await frame.locator('#dish-name').textContent(),selected);
  await frame.locator('#backToSphere').click();await page.locator('#recipeView').waitFor({state:'hidden'});await page.goBack();await frame.locator('#dish-name').waitFor();assert.equal(await page.locator('#recipeView').isVisible(),true);
  passed.push('Recipe deep links, selection, reload, and browser Back preserve the selected dish');
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log(JSON.stringify({passed,errors,failures},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
