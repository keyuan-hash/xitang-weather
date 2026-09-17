import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.TEST_URL;
if (!base) throw new Error('Set TEST_URL to the deployed HTTPS origin');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], requests = [];
let page;
try {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  // Prove the phone does not depend on a direct connection to weather providers.
  await context.route('https://**.open-meteo.com/**', (r) => r.abort());
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => {
    if (new URL(r.url()).pathname.startsWith('/api/'))
      requests.push({ path: new URL(r.url()).pathname, status: r.status() });
  });
  await page.goto(base);
  await page.locator('.weather-hero').waitFor({ timeout: 45000 });
  assert.equal(await page.locator('.hour').count(), 24);
  assert.equal(await page.locator('.day-row').count(), 7);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('navigation', { name: '底部导航' })
    .getByRole('button', { name: '城市', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索城市' }).fill('Shenzhen');
  await page.locator('.city-result').first().waitFor({ timeout: 30000 });
  await page.locator('.city-result').first().locator('button').first().click();
  await page.locator('.weather-hero').waitFor({ timeout: 30000 });
  const city = await page.locator('.city-title h1').innerText();
  assert.match(city, /深圳/);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await fs.mkdir('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/makers-iphone.png', fullPage: true });
  assert.deepEqual(errors, []);
  assert.ok(requests.length >= 3 && requests.every((x) => x.status === 200));
  const result = { at: new Date().toISOString(), base, city,
    checks: ['iPhone viewport', '24 hours', '7 days', 'no horizontal overflow',
      'same-origin APIs only', 'real Shenzhen search and switch',
      'service worker ready', 'no console or JavaScript errors'], requests, errors };
  await fs.writeFile('docs/makers-browser-verification.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ errors, requests, visibleText: await page?.locator('main').innerText().catch(() => '') }));
  throw error;
} finally {
  await browser.close();
}
