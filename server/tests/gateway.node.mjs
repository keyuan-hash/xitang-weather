import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from '../gateway.mjs';
const request = (path, init) => new Request('https://weather.example' + path, init);
const query =
  '/api/forecast?latitude=30.5728&longitude=104.0668&current=temperature_2m&forecast_days=8';
test('transient transport failure reconnects once within the same deadline', async () => {
  let calls = 0, signal;
  const gateway = createGateway({ fetcher: async (_url, options) => {
    calls++;
    if (calls === 1) { signal = options.signal; throw new TypeError('fetch failed'); }
    assert.equal(options.signal, signal);
    return Response.json({ current: { temperature_2m: 20 } });
  } });
  assert.equal((await gateway(request(query))).status, 200);
  assert.equal(calls, 2);
});
test('only fixed weather routes and validated scalar coordinates reach upstream', async () => {
  let calls = 0;
  const gateway = createGateway({
    fetcher: async () => {
      calls++;
      return Response.json({ current: { temperature_2m: 20 } });
    },
  });
  for (const url of [
    '/api/proxy?url=http://127.0.0.1',
    '/api/forecast?latitude=30&longitude=104&url=https://example.com',
    '/api/forecast?latitude=30,40&longitude=104',
    '/api/forecast?latitude=91&longitude=104',
    '/api/forecast?latitude=30&longitude=104&latitude=31',
    '/api/forecast?latitude=30&longitude=104&forecast_days=16',
    '/api/search?name=x',
    '/api/search?name=Chengdu&count=100',
  ])
    assert.ok((await gateway(request(url))).status >= 400);
  assert.equal((await gateway(request(query, { method: 'POST' }))).status, 405);
  assert.equal(calls, 0);
});
test('cache expires after five minutes and parallel identical requests are combined', async () => {
  let clock = 0,
    calls = 0;
  const gateway = createGateway({
    now: () => clock,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(new URL(url).origin, 'https://api.open-meteo.com');
      assert.equal(options.redirect, 'error');
      await new Promise((r) => setTimeout(r, 10));
      return Response.json({ current: { temperature_2m: 20 } });
    },
  });
  const responses = await Promise.all([gateway(request(query)), gateway(request(query))]);
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal(calls, 1);
  await gateway(request(query));
  assert.equal(calls, 1);
  clock = 300001;
  await gateway(request(query));
  assert.equal(calls, 2);
});
test('upstream errors never become successful or cached weather', async () => {
  let calls = 0;
  const gateway = createGateway({
    fetcher: async () => {
      calls++;
      return new Response('unavailable', { status: 503 });
    },
  });
  const results = await Promise.all([gateway(request(query)), gateway(request(query))]);
  assert.ok(results.every((r) => r.status === 502));
  assert.equal(calls, 1);
  assert.equal((await gateway(request(query))).status, 502);
  assert.equal(calls, 2);
});
test('search and air quality reach their own fixed upstreams', async () => {
  const hosts = [];
  const gateway = createGateway({
    fetcher: async (url) => {
      hosts.push(new URL(url).hostname);
      return Response.json({ results: [] });
    },
  });
  assert.equal((await gateway(request('/api/search?name=成都&count=10&language=zh'))).status, 200);
  assert.equal(
    (await gateway(request('/api/air-quality?latitude=30&longitude=104&current=us_aqi,pm2_5')))
      .status,
    200,
  );
  assert.deepEqual(hosts, ['geocoding-api.open-meteo.com', 'air-quality-api.open-meteo.com']);
});
