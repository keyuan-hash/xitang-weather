import { webkit, chromium, devices, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.TEST_URL || 'http://localhost:4173';
const engine = process.env.PWA_ENGINE || 'webkit';
const browser = await (engine === 'chromium'
  ? chromium.launch({ channel: 'chrome' })
  : webkit.launch());
const checks = [];
const pass = (label) => {
  checks.push(label);
  console.log('PASS', label);
};
await fs.mkdir('docs/screenshots/ios', { recursive: true });
try {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const offline = async (value) => {
    if (engine === 'chromium') await context.setOffline(value);
    else if (value)
      await context.route('https://**.open-meteo.com/**', (route) =>
        route.abort('internetdisconnected'),
      );
    else await context.unroute('https://**.open-meteo.com/**');
    if (!value) await page.evaluate(() => window.dispatchEvent(new Event('online')));
  };
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(20000);
  const errors = [],
    consoleErrors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  await page.goto(url);
  await page.locator('.weather-hero').waitFor({ timeout: 45000 });
  assert.equal(await page.locator('.hour').count(), 24);
  assert.equal(await page.locator('.day-row').count(), 7);
  pass(`${engine} iPhone viewport: live weather, 24 hourly and 7 daily forecasts`);
  const manifest = await page.evaluate(async () =>
    (await fetch(document.querySelector('link[rel="manifest"]').href)).json(),
  );
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    assert.equal(
      await page.evaluate(async (src) => {
        const i = new Image();
        i.src = src;
        await i.decode();
        return i.naturalWidth;
      }, icon.src),
      Number(icon.sizes.split('x')[0]),
    );
  }
  assert.equal(
    await page.evaluate(async () => {
      const i = new Image();
      i.src = document.querySelector('link[rel="apple-touch-icon"]').href;
      await i.decode();
      return i.naturalWidth;
    }),
    180,
  );
  pass('Standalone manifest and all iPhone/home-screen icons load');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.locator('.weather-hero').waitFor();
  pass('Production Service Worker activates and controls page');
  for (const width of [320, 390, 430, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole('navigation', { name: '底部导航' });
  for (const button of await nav.getByRole('button').all()) {
    const bounds = await button.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44);
  }
  pass('Four phone widths including landscape: no overflow, navigation targets >=44px');
  await page.screenshot({ path: 'docs/screenshots/ios/weather.png', fullPage: true });
  await nav.getByRole('button', { name: '城市', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '搜索城市' })).toHaveCSS('font-size', '16px');
  await nav.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('heading', { name: '把喜糖放进 iPhone 主屏幕' }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/ios/install.png', fullPage: true });
  assert.deepEqual(consoleErrors, []);
  pass('Safari installation guide, zoom-safe city input, no online console errors');
  if (engine === 'webkit') {
    const cached = await page.evaluate(async () => {
      const cache = await caches.open((await caches.keys()).find((k) => k.includes('precache')));
      return (await cache.keys()).map((r) => r.url);
    });
    assert.ok(cached.some((u) => u.includes('index.html')));
    assert.ok(cached.filter((u) => u.includes('.webp')).length >= 12);
    pass('WebKit cache contains the app shell and all weather scenes');
    assert.deepEqual(errors, []);
    await fs.writeFile(
      'docs/ios-webkit-verification.json',
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          engine,
          device: 'iPhone 13 emulation, not a physical iPhone',
          checks,
          limitation:
            'WebKit automation offline reload fails inside browser engine; offline cold reload is checked independently in Chromium.',
        },
        null,
        2,
      ),
    );
    await browser.close();
    process.exit(0);
  }
  await nav.getByRole('button', { name: '天气', exact: true }).click();
  await offline(true);
  await page.reload();
  await page.locator('.error-banner').waitFor({ timeout: 35000 });
  assert.match(await page.locator('.error-banner').innerText(), /上次保存/);
  assert.match(await page.locator('.updated').innerText(), /缓存/);
  await page.screenshot({ path: 'docs/screenshots/ios/offline.png', fullPage: true });
  pass(
    engine === 'chromium'
      ? 'Offline cold reload serves cached app and labeled weather'
      : 'WebKit API network failure reload shows labeled weather cache',
  );
  await nav.getByRole('button', { name: '喜糖', exact: true }).click();
  for (const name of [
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
    await page.getByRole('button', { name, exact: true }).click();
    await page.locator('.cat-photo').evaluate((i) => i.decode());
  }
  pass(
    engine === 'chromium' ? 'All 12 cat scenes load offline' : 'All 12 cat scenes load in WebKit',
  );
  await offline(false);
  await nav.getByRole('button', { name: '天气', exact: true }).click();
  await page.locator('.error-banner').waitFor({ state: 'hidden', timeout: 35000 });
  assert.doesNotMatch(await page.locator('.updated').innerText(), /缓存/);
  pass('Reconnection automatically refreshes live weather');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage).filter((k) => k.startsWith('xitang:weather:'))) {
      const data = JSON.parse(localStorage.getItem(key));
      data.fetchedAt = Date.now() - 25 * 3600000;
      localStorage.setItem(key, JSON.stringify(data));
    }
  });
  await offline(true);
  await page.reload();
  await page.getByText('暂时没连上这片天空').waitFor({ timeout: 35000 });
  assert.equal(await page.locator('.main-temperature').count(), 0);
  assert.deepEqual(errors, []);
  pass('Expired weather is rejected offline; no uncaught JavaScript exceptions');
  await fs.writeFile(
    `docs/ios-${engine}-verification.json`,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        engine,
        device: 'iPhone 13 emulation (not a physical iPhone)',
        offlineMethod:
          engine === 'webkit'
            ? 'Abort weather API routes only; offline cold navigation verified separately in Chromium because WebKit automation has internal navigation errors'
            : 'Browser offline mode',
        checks,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
