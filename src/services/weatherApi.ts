import { weatherEndpoint } from './weatherEndpoint';
import type { AirQuality, City, Weather } from '../types/weather';
export const DEFAULT_CITY: City = {
  id: 'chengdu',
  name: '成都',
  latitude: 30.5728,
  longitude: 104.0668,
  region: '四川',
  country: '中国',
};
export const POPULAR_CITIES: City[] = [
  DEFAULT_CITY,
  {
    id: 'beijing',
    name: '北京',
    latitude: 39.9042,
    longitude: 116.4074,
    region: '北京',
    country: '中国',
  },
  {
    id: 'shanghai',
    name: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    region: '上海',
    country: '中国',
  },
  {
    id: 'guangzhou',
    name: '广州',
    latitude: 23.1291,
    longitude: 113.2644,
    region: '广东',
    country: '中国',
  },
  {
    id: 'hangzhou',
    name: '杭州',
    latitude: 30.2741,
    longitude: 120.1551,
    region: '浙江',
    country: '中国',
  },
  {
    id: 'tokyo',
    name: '东京',
    latitude: 35.6762,
    longitude: 139.6503,
    region: '东京都',
    country: '日本',
  },
];
export function isCity(value: unknown): value is City {
  if (!value || typeof value !== 'object') return false;
  const c = value as City;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    Number.isFinite(c.latitude) &&
    Math.abs(c.latitude) <= 90 &&
    Number.isFinite(c.longitude) &&
    Math.abs(c.longitude) <= 180
  );
}
export async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`天气服务返回 ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
type RecordData = Record<string, unknown>;
const obj = (v: unknown): RecordData =>
  typeof v === 'object' && v !== null ? (v as RecordData) : {};
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export function normalizeWeather(raw: unknown): Weather {
  const data = obj(raw),
    c = obj(data.current),
    h = obj(data.hourly),
    d = obj(data.daily);
  if (!str(c.time) || num(c.temperature_2m) === null || !arr(h.time).length || !arr(d.time).length)
    throw new Error('天气数据不完整，请稍后重试');
  const current = {
    time: str(c.time),
    temperature: num(c.temperature_2m),
    apparent: num(c.apparent_temperature),
    humidity: num(c.relative_humidity_2m),
    windSpeed: num(c.wind_speed_10m),
    windDirection: num(c.wind_direction_10m),
    code: num(c.weather_code),
    isDay: c.is_day === 1,
  };
  const allHours = arr(h.time).map((time, i) => ({
    time: str(time),
    temperature: num(arr(h.temperature_2m)[i]),
    precipitation: num(arr(h.precipitation_probability)[i]),
    code: num(arr(h.weather_code)[i]),
    isDay: arr(h.is_day)[i] === 1,
  }));
  const start = allHours.findIndex((hour) => hour.time >= current.time.slice(0, 13) + ':00');
  if (start < 0) throw new Error('小时预报已过期，请刷新');
  return {
    current,
    hourly: allHours.slice(start, start + 24),
    daily: arr(d.time)
      .slice(0, 7)
      .map((date, i) => ({
        date: str(date),
        high: num(arr(d.temperature_2m_max)[i]),
        low: num(arr(d.temperature_2m_min)[i]),
        precipitation: num(arr(d.precipitation_probability_max)[i]),
        code: num(arr(d.weather_code)[i]),
        sunrise: str(arr(d.sunrise)[i]) || null,
        sunset: str(arr(d.sunset)[i]) || null,
        uv: num(arr(d.uv_index_max)[i]),
      })),
    timezone: str(data.timezone) || 'UTC',
    fetchedAt: Date.now(),
  };
}
export async function fetchWeather(city: City, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: 'auto',
    forecast_days: '8',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
    wind_speed_unit: 'kmh',
  });
  return normalizeWeather(await fetchJson(weatherEndpoint('forecast', params), signal));
}
export async function fetchAirQuality(city: City, signal?: AbortSignal): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: 'auto',
    current: 'us_aqi,pm2_5',
  });
  const data = obj(await fetchJson(weatherEndpoint('air-quality', params), signal));
  const c = obj(data.current);
  if (!str(c.time)) throw new Error('空气质量暂不可用');
  return { aqi: num(c.us_aqi), pm25: num(c.pm2_5), time: str(c.time) };
}
const aliases: Record<string, string> = {
  成都: 'Chengdu',
  北京: 'Beijing',
  上海: 'Shanghai',
  广州: 'Guangzhou',
  深圳: 'Shenzhen',
  杭州: 'Hangzhou',
  重庆: 'Chongqing',
  西安: 'Xi’an',
  东京: 'Tokyo',
  纽约: 'New York',
  伦敦: 'London',
  香港: 'Hong Kong',
  台北: 'Taipei',
  臺北: 'Taipei',
};
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const search = async (name: string) => {
    const p = new URLSearchParams({ name, count: '10', language: 'zh', format: 'json' });
    const data = obj(await fetchJson(weatherEndpoint('search', p), signal));
    return arr(data.results)
      .map((item) => {
        const c = obj(item);
        return {
          id: String(c.id),
          name: str(c.name),
          latitude: num(c.latitude),
          longitude: num(c.longitude),
          region: str(c.admin1),
          country: str(c.country),
        };
      })
      .filter((item): item is City & typeof item => isCity(item));
  };
  let results = await search(clean);
  if (!results.length && aliases[clean]) results = await search(aliases[clean]);
  return results;
}
export function locateCity(): Promise<City> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位，已切换到成都。'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          id: `gps:${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`,
          name: '当前位置',
          region: `${Math.abs(coords.latitude).toFixed(2)}°${coords.latitude >= 0 ? 'N' : 'S'} · ${Math.abs(coords.longitude).toFixed(2)}°${coords.longitude >= 0 ? 'E' : 'W'}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? '定位未授权，已为你显示成都天气。'
              : '暂时无法获取位置，已为你显示成都天气。',
          ),
        ),
      { timeout: 12000, maximumAge: 300000, enableHighAccuracy: false },
    );
  });
}
