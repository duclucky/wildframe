const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const base=process.env.TEST_BASE_URL;if(!base)throw Error('Set TEST_BASE_URL to the deployed origin.');
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  const response=await page.goto(base);assert.equal(response.status(),200);assert.match(await page.title(),/WildFrame/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),base+'/');
  for(const asset of ['/favicon.svg','/social-preview.png','/assets/experiments/experiment-fox-ink-wash-thumb.webp','/try','/credits'])assert.equal((await page.request.get(base+asset)).status(),200,asset);
  for(const privatePath of ['/source/app.js','/.env','/qa/wildframe-home-desktop.png'])assert.equal((await page.request.get(base+privatePath)).status(),404,privatePath);
  await page.locator('#startJourney').click();await page.locator('#journeyNext').click();await page.locator('#journeyNext').click();await page.locator('#journeyNext').click();await page.locator('#variationName').fill('Production QA only');await page.locator('#saveVariation').click();assert.match(await page.locator('#journeyTitle').textContent(),/saved/i);
  await page.screenshot({path:'qa/wildframe-live-smoke.png'});assert.deepEqual(errors,[]);
  console.log(JSON.stringify({publicSite:base,anonymousAccess:200,publicAssets:'pass',privatePaths:'404',guidedSave:'pass',errors},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
