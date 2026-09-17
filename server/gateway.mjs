const common = ['latitude', 'longitude', 'timezone'];
const routes = {
  '/api/forecast': {
    url: 'https://api.open-meteo.com/v1/forecast',
    keys: [...common, 'forecast_days', 'current', 'hourly', 'daily', 'wind_speed_unit'],
    ttl: 300_000,
  },
  '/api/air-quality': {
    url: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    keys: [...common, 'current'],
    ttl: 600_000,
  },
  '/api/search': {
    url: 'https://geocoding-api.open-meteo.com/v1/search',
    keys: ['name', 'count', 'language', 'format'],
    ttl: 86_400_000,
  },
};
const fields = new Set(
  'temperature_2m relative_humidity_2m apparent_temperature is_day weather_code wind_speed_10m wind_direction_10m precipitation_probability temperature_2m_max temperature_2m_min sunrise sunset precipitation_probability_max uv_index_max us_aqi pm2_5'.split(
    ' ',
  ),
);
const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function createGateway({ fetcher = fetch, now = Date.now } = {}) {
  const cache = new Map(),
    pending = new Map();
  return async function gateway(request) {
    const url = new URL(request.url),
      route = routes[url.pathname];
    if (!route) return json(404, { error: '接口不存在' });
    if (request.method !== 'GET') return json(405, { error: '仅支持 GET' });
    const params = url.searchParams;
    if (url.search.length > 2000) return json(400, { error: '查询参数过长' });
    for (const [key, value] of params) {
      if (!route.keys.includes(key) || params.getAll(key).length !== 1 || value.length > 400)
        return json(400, { error: '不支持的查询参数' });
      if (
        ['current', 'hourly', 'daily'].includes(key) &&
        value.split(',').some((v) => !fields.has(v))
      )
        return json(400, { error: '不支持的天气字段' });
    }
    if (url.pathname === '/api/search') {
      if (
        (params.get('name')?.trim().length || 0) < 2 ||
        params.get('name').length > 80 ||
        (params.has('count') && !/^(?:[1-9]|10)$/.test(params.get('count')))
      )
        return json(400, { error: '城市查询不正确' });
    } else {
      for (const [key, max] of [
        ['latitude', 90],
        ['longitude', 180],
      ]) {
        const value = params.get(key);
        if (value === null || !/^-?\d+(?:\.\d+)?$/.test(value) || Math.abs(Number(value)) > max)
          return json(400, { error: '城市坐标不正确' });
      }
      if (params.has('forecast_days') && !/^[1-8]$/.test(params.get('forecast_days')))
        return json(400, { error: '预报范围不正确' });
    }
    params.sort();
    const upstream = `${route.url}?${params}`,
      key = upstream;
    const hit = cache.get(key);
    if (hit && hit.expires > now()) return json(200, hit.body);
    if (pending.has(key)) {
      try {
        return json(200, await pending.get(key));
      } catch {
        return json(502, { error: '暂时连接不到天气服务，请稍后重试' });
      }
    }
    if (pending.size >= 4) return json(503, { error: '天气服务繁忙，请稍后重试' });
    const work = (async () => {
      const options = {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
        redirect: 'error',
      };
      let result;
      try {
        result = await fetcher(upstream, options);
      } catch (error) {
        // Reconnect once after a transport failure; keep the original 12-second budget.
        // HTTP failures (including rate limits) are not retried.
        if (options.signal.aborted) throw error;
        result = await fetcher(upstream, options);
      }
      if (!result.ok) throw new Error(`upstream status ${result.status}`);
      const body = await result.json();
      if (!body || body.error) throw new Error('invalid upstream data');
      if (cache.size >= 512) cache.delete(cache.keys().next().value);
      cache.set(key, { body, expires: now() + route.ttl });
      return body;
    })();
    pending.set(key, work);
    try {
      return json(200, await work);
    } catch (error) {
      // Diagnostic only: never log query strings, locations, client IPs or response bodies.
      console.warn('weather upstream failed', url.pathname, error?.cause?.code || error?.name,
        error?.message === 'fetch failed' ? 'fetch failed' : error?.message);
      return json(502, { error: '暂时连接不到天气服务，请稍后重试' });
    } finally {
      pending.delete(key);
    }
  };
}
