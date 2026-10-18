const { chromium } = require('C:/Users/TBC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], passed = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173');
    await page.locator('#browsePrompts').click();
    await page.locator('.open-recipe img').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-card img')].slice(0, 4).every(image => image.complete && image.naturalWidth));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
    await page.locator('.recipe-card').first().hover();
    await page.waitForFunction(() => document.querySelector('.recipe-card.spotlight-active'));
    const card = page.locator('.recipe-card').first();
    assert.ok(await card.evaluate(element => element.style.getPropertyValue('--spot-x')));
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
    await page.screenshot({ path: 'qa/wildframe-library-desktop.png' });
    await page.mouse.move(1400, 980);
    assert.equal(await page.locator('.spotlight-active').count(), 0);
    passed.push('Spotlight follows the pointer and resets on exit; card entrances settle');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-category="Landscapes"]').click();
    assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), 0);
    await page.locator('#styleFilter').selectOption('Ink wash');
    await page.locator('.open-recipe[data-id="ai-ink-mountains"]').click();
    await page.waitForFunction(() => document.querySelector('#promptImage').complete && document.querySelector('#promptImage').naturalWidth);
    await page.screenshot({ path: 'qa/wildframe-prompt-desktop.png' });
    await page.locator('#customizePrompt').click();
    await page.screenshot({ path: 'qa/wildframe-studio-desktop.png' });
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    passed.push('Reduced-motion preference disables decorative animation without hiding content');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto('http://127.0.0.1:4173'); await mobile.locator('#browsePrompts').tap();
    for (const viewport of [{ width: 320, height: 740 }, { width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 844, height: 390 }]) {
      await mobile.setViewportSize(viewport);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.querySelector('#library').scrollWidth > innerWidth), false, `Overflow at ${viewport.width}`);
      const header = await mobile.locator('header').evaluate(element => [...element.querySelectorAll('a,button')].filter(control => control.getClientRects().length).map(control => { const r = control.getBoundingClientRect(); return { left: r.left, right: r.right }; }));
      assert.ok(header.every(control => control.left >= 0 && control.right <= viewport.width), `Header overflow at ${viewport.width}`);
    }
    await mobile.setViewportSize({ width: 375, height: 812 });
    await mobile.locator('[data-category="Landscapes"]').tap();
    await mobile.waitForFunction(() => [...document.querySelectorAll('.recipe-card img')].slice(0, 2).every(image => image.complete && image.naturalWidth));
    await mobile.screenshot({ path: 'qa/wildframe-library-mobile.png' });
    await mobile.locator('.open-recipe').first().tap(); await mobile.locator('#customizePrompt').tap();
    await mobile.locator('#studioNegative').focus();
    await mobile.screenshot({ path: 'qa/wildframe-studio-focused-mobile.png' });
    passed.push('320px–1440px layouts, phone landscape, and mobile focused-field visual QA');

    const failed = await browser.newPage({ reducedMotion: 'reduce' });
    failed.on('pageerror', error => errors.push(error.message));
    await failed.route('**/assets/**', route => route.abort());
    await failed.goto('http://127.0.0.1:4173'); await failed.locator('#browsePrompts').click();
    await failed.locator('.preview-message').first().waitFor();
    await failed.locator('.open-recipe').first().click();
    assert.ok((await failed.locator('#masterText').inputValue()).length > 100);
    passed.push('Missing images display an intentional fallback and retain readable masterprompts');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
