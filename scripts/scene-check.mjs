import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const result = { verifiedAt: new Date().toISOString(), scenes: [], viewports: [], errors };
const labels = [
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
];
const extra = new Map([
  ['小雨', 'rain'],
  ['大雨', 'heavy-rain'],
  ['雷暴', 'thunderstorm'],
  ['高温', 'hot'],
]);
await fs.mkdir('docs/screenshots/v3', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(process.env.TEST_URL || 'http://localhost:5173');
  await page.locator('.weather-hero').waitFor({ timeout: 45000 });
  assert.equal(await page.locator('.hour').count(), 24);
  assert.equal(await page.locator('.day-row').count(), 7);
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '喜糖', exact: true })
    .click();
  for (const label of labels) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.locator('.cat-photo').evaluate((img) => img.decode());
    assert.equal(await page.locator('.cat-scene').getAttribute('data-asset-kind'), 'composed');
    result.scenes.push({ label, src: await page.locator('.cat-photo').getAttribute('src') });
    if (extra.has(label))
      await page
        .locator('.cat-preview')
        .screenshot({ path: `docs/screenshots/v3/${extra.get(label)}-desktop.png` });
  }
  assert.equal(new Set(result.scenes.map((scene) => scene.src)).size, 12);
  assert.equal(await page.locator('.scene-thumbnail small').count(), 0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    result.viewports.push(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, id] of extra) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.locator('.cat-photo').evaluate((img) => img.decode());
    await page.locator('.cat-preview').screenshot({ path: `docs/screenshots/v3/${id}-mobile.png` });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile('docs/scene-verification.json', JSON.stringify(result, null, 2));
  console.log(
    'PASS: all 12 Image 2 scenes, no placeholders, 24-hour/7-day data, four viewports, no console errors.',
  );
} finally {
  await browser.close();
}
