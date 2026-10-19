const assert=require('node:assert/strict');const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const errors=[],passed=[];try{
 for(const [width,height] of [[1366,768],[1280,720],[1135,957],[614,630],[390,844],[375,812],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:4174')+'/#menu');const frame=page.frameLocator('#recipeFrame');await page.locator('#viewLoading').waitFor({state:'hidden'});
  assert.equal(await frame.locator('header').count(),0);
  for(let p=0;p<3;p++){
   for(let i=0;i<4;i++){
    await frame.locator('.dish-card').nth(i).click();await frame.locator('body').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const bounds=await frame.locator('body').evaluate(el=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight,sections:[...el.querySelectorAll('#stage,#details,#recipe-menu,.kitchen-footer,#view-recipe,#backToSphere,.dish-card,.arrow-button,.pager button')].map(e=>({name:e.id||e.className,...e.getBoundingClientRect().toJSON()}))}));
    assert.ok(bounds.width<=bounds.viewportWidth&&bounds.height<=bounds.viewportHeight,JSON.stringify({viewport:[width,height],page:p,dish:i,...bounds}));
    assert.ok(bounds.sections.every(r=>r.top>=-1&&r.left>=-1&&r.right<=width+1&&r.bottom<=height+1),JSON.stringify({viewport:[width,height],page:p,dish:i,outside:bounds.sections.filter(r=>r.top< -1||r.left< -1||r.right>width+1||r.bottom>height+1)}));
   }if(p<2)await frame.locator('#next').click();
  }
  await page.screenshot({path:`qa/kitchen-fit-${width}x${height}.png`});passed.push(width+'×'+height+': all 12 dishes, details, collection and navigation fit without scrolling');await page.close();
 }assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
