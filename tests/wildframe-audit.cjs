const { chromium } = require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [], passed = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173');
    await page.locator('#browsePrompts').click();
    await page.locator('#library').evaluate(element => element.scrollTop = element.scrollHeight);
    await page.locator('#libraryNav').click();
    const search = await page.locator('#promptSearch').boundingBox();
    assert.ok(search.y > 80 && search.y + search.height < 900, 'Reopening the library must show its focused search field');
    passed.push('Library navigation reveals search after browsing deep into the collection');

    await page.locator('#promptSearch').fill('does-not-exist');
    await page.locator('#clearFilters').click();
    assert.equal(await page.locator('#promptSearch').evaluate(element => element === document.activeElement), true, 'Clearing filters must not leave focus on a hidden button');
    await page.locator('.card-save').first().click();
    await page.locator('#savedNav').click();
    assert.equal(await page.locator('#libraryTitle').textContent(), 'Your saved prompts.');
    assert.equal(await page.locator('.card-save').first().getAttribute('aria-label'), 'Unsave The Mountain Keeps Its Own Time');
    passed.push('Clear filters preserves focus; saved collection has an accurate heading and action label');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto('http://127.0.0.1:4173');
    await mobile.locator('#browsePrompts').tap();
    const targets = await mobile.locator('.card-save').first().boundingBox();
    assert.ok(targets.width >= 44 && targets.height >= 44, 'Bookmark hit area must be comfortable for touch');
    await mobile.locator('.open-recipe').first().tap();
    await mobile.locator('#customizePrompt').tap();
    await mobile.locator('#studioNegative').focus();
    const field = await mobile.locator('#studioNegative').boundingBox();
    const bar = await mobile.locator('#studioPrimaryActions').boundingBox();
    const close = await mobile.locator('#studioClose').boundingBox();
    assert.ok(close.y >= 0 && close.y + close.height < 120, 'Back to prompt must remain visible when editing lower fields');
    assert.ok(field.y >= 60 && field.y + field.height + 8 <= bar.y, 'Focused studio field must remain above the fixed action bar');
    passed.push('Mobile bookmarks have 44px targets and focused studio fields avoid fixed actions');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
