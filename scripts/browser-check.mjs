import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const checks = [];
const check = (label) => {
  checks.push(label);
  console.log(`PASS ${label}`);
};
await fs.mkdir('docs/screenshots', { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(url);
  await page.locator('.weather-hero').waitFor({ timeout: 45000 });
  assert.equal(await page.locator('.hour').count(), 24);
  assert.equal(await page.locator('.day-row').count(), 7);
  assert.match(await page.locator('.main-temperature').innerText(), /\d+°/);
  check('Live Open-Meteo weather, 24 hours, 7 days');
  const liveData = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith('xitang:weather:'))
      .map((k) => JSON.parse(localStorage.getItem(k))),
  );
  assert.ok(liveData[0].current.time);
  await fs.writeFile(
    'docs/live-verification.json',
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        city: '成都',
        dataTime: liveData[0].current.time,
        temperature: liveData[0].current.temperature,
        hours: 24,
        days: 7,
      },
      null,
      2,
    ),
  );
  await page.screenshot({ path: 'docs/screenshots/desktop-live.png', fullPage: true });
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '城市', exact: true })
    .click();
  await page.getByRole('textbox', { name: '搜索城市' }).fill('Tokyo');
  await page.locator('.city-result').first().waitFor({ timeout: 35000 });
  await page.locator('.city-result').first().locator('button').last().click();
  const savedCount = await page.locator('.saved-city').count();
  assert.ok(savedCount >= 2);
  check('Live geocoding search and saved cities');
  await page.locator('.city-result').first().locator('button').first().click();
  await page.locator('.weather-hero').waitFor({ timeout: 35000 });
  assert.notEqual(await page.locator('.city-title h1').innerText(), '成都');
  check('Switch city and fetch its weather');
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '设置', exact: true })
    .click();
  await page.getByRole('button', { name: '°F', exact: true }).click();
  await page.getByRole('switch', { name: '天气动画' }).click();
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '天气', exact: true })
    .click();
  assert.equal(await page.locator('.weather-animation').count(), 0);
  assert.ok(parseInt(await page.locator('.main-temperature').innerText()) > 32);
  check('Fahrenheit conversion and animation setting');
  await page.reload();
  await page.locator('.weather-hero').waitFor();
  assert.equal(await page.locator('.weather-animation').count(), 0);
  check('Preferences persist after reload');
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '城市', exact: true })
    .click();
  assert.equal(await page.locator('.saved-city').count(), savedCount);
  await page.locator('.remove-city').last().click();
  assert.equal(await page.locator('.saved-city').count(), savedCount - 1);
  check('City persistence and removal');
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 });
  await page.getByRole('button', { name: '使用我的当前位置' }).click();
  await page.locator('.city-title h1').filter({ hasText: '当前位置' }).waitFor();
  await page.locator('.weather-hero').waitFor({ timeout: 35000 });
  check('Granted browser geolocation fetches coordinate weather');
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '喜糖', exact: true })
    .click();
  for (const label of [
    '晴天',
    '多云',
    '阴天',
    '小雨',
    '大雨',
    '雷暴',
    '下雪',
    '大雾',
    '大风',
    '夜晚',
    '夜雨',
    '高温',
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.waitForFunction(() => {
      const img = document.querySelector('.cat-photo');
      return img?.complete && img.naturalWidth > 0;
    });
    assert.match(await page.locator('.pill').innerText(), /非实时天气/);
  }
  check('All 12 scene previews have valid images and explicit preview label');
  await page.getByRole('button', { name: '晴天', exact: true }).click();
  await page.screenshot({ path: 'docs/screenshots/scene-sunny.png', fullPage: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  check('No horizontal page overflow at 320, 390, 768, 1440 px');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('navigation', { name: '底部导航' })
    .getByRole('button', { name: '天气', exact: true })
    .click();
  await page.locator('.weather-hero').waitFor();
  await page.screenshot({ path: 'docs/screenshots/mobile-live.png', fullPage: true });
  assert.deepEqual(errors, []);
  check('No browser console errors or uncaught exceptions during live workflow');
  await context.close();
  // Explicitly simulate denied permission in a fresh isolated browser context.
  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, failure) =>
      failure({ code: 1, message: 'denied' });
  });
  const deniedPage = await denied.newPage();
  await deniedPage.goto(url);
  await deniedPage.getByRole('button', { name: '使用当前位置', exact: true }).click();
  await deniedPage.getByRole('status').filter({ hasText: '定位未授权' }).waitFor();
  assert.equal(await deniedPage.locator('.city-title h1').innerText(), '成都');
  check('Denied geolocation explicitly falls back to Chengdu');
  await denied.close();
  // Fault injection: never use these responses as live weather or screenshots.
  const fault = await browser.newContext();
  const fp = await fault.newPage();
  await fp.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
  await fp.route('https://air-quality-api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
  await fp.goto(url);
  await fp.getByText('暂时没连上这片天空').waitFor();
  assert.equal(await fp.locator('.main-temperature').count(), 0);
  check('Fresh network failure shows retry state, never fabricated weather');
  await fp.evaluate(
    (data) => localStorage.setItem('xitang:weather:30.573,104.067', JSON.stringify(data)),
    liveData[0],
  );
  await fp.reload();
  await fp.locator('.error-banner').waitFor();
  assert.match(await fp.locator('.error-banner').innerText(), /上次保存/);
  assert.match(await fp.locator('.updated').innerText(), /缓存/);
  check('Network failure displays timestamped, explicitly labeled cache');
  await fp.unroute('https://api.open-meteo.com/**');
  await fp.getByRole('button', { name: '重新连接', exact: true }).click();
  await fp.locator('.error-banner').waitFor({ state: 'hidden', timeout: 35000 });
  await fp.getByText('空气质量暂不可用', { exact: true }).waitFor();
  check('Weather recovers while AQI failure stays isolated');
  await fault.close();
  await fs.writeFile(
    'docs/browser-checks.json',
    JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2),
  );
} finally {
  await browser.close();
}
