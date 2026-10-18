const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const atlas=require('../assets/atlas-recipes.json');
const experiments=require('../assets/visual-experiments.json');
const catalog=require('../assets/prompt-catalog.json');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
  const expected=catalog.length+atlas.length+experiments.recipes.length;
  assert.equal(await page.locator('.sphere-card').count(),expected);
  const ids=await page.locator('.sphere-card').evaluateAll(cards=>cards.map(card=>card.dataset.id));assert.equal(new Set(ids).size,expected);
  for(const recipe of atlas)assert.ok(ids.includes(recipe.id));
  await page.waitForFunction(()=>[...document.querySelectorAll('.sphere-card img')].every(image=>image.complete&&image.naturalWidth>0),null,{timeout:30000});
  assert.equal(await page.locator('#heroCount').textContent(),String(expected));
  await page.screenshot({path:'qa/wildframe-dense-sphere-desktop.png'});
  await page.locator('#browsePrompts').click();assert.equal(await page.locator('.recipe-card').count(),catalog.length+atlas.length);
  await page.locator('#promptSearch').fill('An island drawn in ink');await page.locator('.open-recipe').click();assert.equal(await page.locator('#masterText').inputValue(),atlas.find(recipe=>recipe.title==='An island drawn in ink').prompt);
  await page.locator('#dnaMode').click();assert.ok(await page.locator('.dna-part').count()>=3);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({uniqueSphereImages:expected,libraryRecipes:catalog.length+atlas.length,newImages:atlas.length,loaded:true,copySourceAndDna:'pass',errors},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
