const {chromium}=require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const recipeData=JSON.parse(fs.readFileSync(path.join(__dirname,'../source/recipes.json'),'utf8'));
for(const [key,[name,cell,atlas]] of Object.entries(recipeData.ingredientCatalog)){
 assert.ok(Number.isInteger(cell)&&cell>=0&&cell<20,`${name}: valid illustration cell required`);
 assert.ok(atlas===undefined||atlas==='world',`${key}: supported ingredient atlas required`);
}
const ingredientArtwork=JSON.parse(fs.readFileSync(path.join(__dirname,'../source/artwork-prompts.json'),'utf8')).assets.find(asset=>asset.id==='world-ingredients');
for(const [index,key] of ingredientArtwork.cells.entries())assert.deepEqual(recipeData.ingredientCatalog[key].slice(1),[index,'world'],`${key}: sprite must match its documented ingredient`);
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[],failed=[],seen=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
 try{
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4174');assert.equal(await page.locator('html').getAttribute('lang'),'en','Website must use English');
  assert.match(await page.title(),/^Savor Atlas — A world of recipes$/);
  assert.equal(await page.locator('.brand-name').innerText(),'Savor Atlas');
  await page.waitForFunction(()=>document.querySelectorAll('.sphere-card img.ready').length===60);
  const imageNames=await page.locator('.sphere-card img').evaluateAll(items=>[...new Set(items.map(i=>i.src))]);assert.equal(imageNames.length,12);
  assert.deepEqual(imageNames.map(src=>new URL(src).pathname.split('/').pop()).sort(),recipeData.dishes.map(dish=>'globe-'+dish.id+'.webp').sort(),'Every globe image must belong to the current recipe collection');
  await page.getByRole('button',{name:'Explore recipes',exact:true}).click();const frame=page.frameLocator('#recipeFrame');await frame.locator('#dish-name').waitFor();assert.equal(await frame.locator('html').getAttribute('lang'),'en');
  assert.match(await frame.locator('title').textContent(),/^Savor Atlas/);
  assert.equal(await frame.locator('header').count(),0,'The kitchen must not show a top header');
  assert.equal(await frame.locator('footer #backToSphere').count(),1,'Return navigation belongs in the footer');
  for(let p=0;p<3;p++){
   for(let i=0;i<4;i++){
    const card=frame.locator('.dish-card').nth(i);const name=await card.locator('strong').textContent();await card.click();
    const country=(await frame.locator('#category').textContent()).split(' / ')[0];assert.ok(country.length>2);seen.push({name,country});
    await frame.locator('#stage').press('Enter');await frame.locator('#detail-panel').waitFor({state:'visible'});assert.equal(await frame.locator('#modal-name').textContent(),name);
    assert.ok(await frame.locator('#recipe-ingredients li').count()>=8);assert.ok(await frame.locator('#recipe-steps li').count()>=5);
    assert.equal(await frame.locator('#modal-ingredients .ingredient-photo').count(),4);
    assert.equal(await frame.locator('#modal-ingredients .ingredient-initial').count(),0,`${name}: every featured ingredient needs a real image`);
    const photos=await frame.locator('#modal-ingredients .ingredient-photo').evaluateAll(async items=>Promise.all(items.map(async item=>{
     const style=getComputedStyle(item),url=style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
     if(!url)return false;
     const image=new Image();image.src=url;try{await image.decode();return image.naturalWidth>0&&style.backgroundPosition!==''}catch{return false}
    })));
    assert.ok(photos.every(Boolean),`${name}: ingredient sprites must load successfully`);
    assert.match(await frame.locator('#modal-servings').textContent(),/2 servings/);
    const body=await frame.locator('#detail-panel').innerText();assert.doesNotMatch(body,/Khẩu phần|Bắt đầu|công thức|Đặt hàng|phút/);
    await frame.locator('.dialog-close').click();await frame.locator('#dish-dialog').waitFor({state:'hidden'});
   }
   if(p<2){
    await frame.locator('#next').click();
    await page.waitForFunction(()=>document.querySelector('#recipeFrame').contentDocument.querySelector('#menu-track').getAttribute('aria-busy')!=='true');
   }
  }
  assert.equal(new Set(seen.map(d=>d.country)).size,12);assert.ok(seen.some(d=>d.country==='Vietnam'&&d.name==='Chicken Pho'));assert.ok(seen.some(d=>d.country==='Italy'&&d.name==='Spaghetti Carbonara'));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({passed:'English UI, 12 countries, 12 matching dish images, 48 featured ingredient images loaded, all cooking steps available',seen,errors,failed},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
