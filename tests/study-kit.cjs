const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:375,height:812}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173/try.html');
  assert.equal(await page.locator('[data-task]').count(),3);
  await page.locator('#sessionId').fill('automated-QA-only');
  await page.locator('[data-start="find"]').click();await page.locator('[data-task="find"] [data-outcome="completed"]').click();
  await page.locator('#notes-find').fill('Synthetic check, not a human usability result.');
  await page.locator('#friction').fill('QA export validation only.');
  const pending=page.waitForEvent('download');await page.locator('#exportSession').click();const download=await pending,stream=await download.createReadStream();let json='';for await(const chunk of stream)json+=chunk.toString();const data=JSON.parse(json);
  assert.equal(data.kind,'self_reported_usability_session');assert.equal(data.tasks[0].status,'completed');assert.equal(data.tasks[1].status,'not_started');assert.ok(data.tasks[0].elapsedSeconds>=0);assert.equal(data.participantCode,'automated-QA-only');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  console.log('PASS: three neutral tasks, self-reported outcomes, local JSON export and mobile layout. This is an automated form check, not a participant result.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
