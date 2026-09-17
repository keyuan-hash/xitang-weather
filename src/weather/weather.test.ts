import { describe, expect, it } from 'vitest';
import { resolveWeather, weatherCategory, weatherLabel } from './weatherMapping';
import { getDialogue } from './weatherDialogue';
import { normalizeWeather, isCity } from '../services/weatherApi';
import { clockTime, dateLabel, temperature, windDirection } from '../lib/format';
import type { CurrentWeather } from '../types/weather';
const base: CurrentWeather = {
  time: '2026-09-15T12:00',
  temperature: 25,
  apparent: 25,
  humidity: 60,
  windSpeed: 8,
  windDirection: 0,
  code: 0,
  isDay: true,
};
describe('WMO codes and scene precedence', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('supports official WMO code %s', (code) => expect(weatherCategory(code)).not.toBe('unknown'));
  it('preserves unknown rather than silently reporting sunny', () => {
    expect(weatherCategory(1000)).toBe('unknown');
    expect(weatherLabel(null)).toContain('暂缺');
  });
  it.each([
    [{ code: 0 }, 'sunny'],
    [{ code: 2 }, 'cloudy'],
    [{ code: 3 }, 'overcast'],
    [{ code: 61 }, 'rain'],
    [{ code: 65 }, 'heavy-rain'],
    [{ code: 95 }, 'thunderstorm'],
    [{ code: 71 }, 'snow'],
    [{ code: 45 }, 'fog'],
    [{ windSpeed: 40 }, 'wind'],
    [{ isDay: false }, 'night'],
    [{ code: 61, isDay: false }, 'night-rain'],
    [{ temperature: 35 }, 'hot'],
    [{ code: 95, isDay: false, temperature: 40, windSpeed: 60 }, 'thunderstorm'],
    [{ code: 65, temperature: 40 }, 'heavy-rain'],
    [{ code: 71, windSpeed: 50 }, 'snow'],
    [{ code: 65, isDay: false }, 'heavy-rain'],
  ])('resolves %j to %s', (patch, scene) =>
    expect(resolveWeather({ ...base, ...patch }).scene).toBe(scene),
  );
  it('labels medium rain accurately', () => expect(weatherLabel(63)).toBe('中雨'));
});
describe('city-local time and units', () => {
  it('does not shift Tokyo/New York wall clock to browser timezone', () => {
    expect(clockTime('2026-09-15T06:21')).toBe('06:21');
    expect(dateLabel('2026-09-15T01:00')).toBe('星期二');
  });
  it('converts all temperature units including negatives and missing data', () => {
    expect(temperature(0, 'f')).toBe('32°');
    expect(temperature(-10)).toBe('-10°');
    expect(temperature(null)).toBe('—');
  });
  it('handles compass wrap and unavailable wind direction', () => {
    expect(windDirection(359)).toBe('北风');
    expect(windDirection(90)).toBe('东风');
    expect(windDirection(null)).toBe('风向暂无');
  });
});
describe('dialogue', () => {
  it('includes the requested hot-weather personality', () =>
    expect(getDialogue('hot', base, () => 0)).toBe('太热了……本皇上已经躺平。'));
  it('responds to cold temperatures', () =>
    expect(getDialogue('night', { ...base, temperature: 0 }, () => 0.999)).toContain('暖气'));
  it('responds to morning hours', () =>
    expect(getDialogue('sunny', { ...base, time: '2026-09-15T08:00' }, () => 0.999)).toContain(
      '早上好',
    ));
});
describe('API normalization', () => {
  const fixture = () => ({
    timezone: 'Asia/Shanghai',
    current: { time: '2026-09-15T23:45', temperature_2m: 20, is_day: 0 },
    hourly: {
      time: Array.from(
        { length: 72 },
        (_, i) => `2026-09-${15 + Math.floor(i / 24)}T${String(i % 24).padStart(2, '0')}:00`,
      ),
      temperature_2m: Array(72).fill(20),
      precipitation_probability: [null, ...Array(71).fill(null)],
    },
    daily: {
      time: Array.from({ length: 8 }, (_, i) => `2026-09-${15 + i}`),
      temperature_2m_max: Array(8).fill(25),
      temperature_2m_min: Array(8).fill(17),
    },
  });
  it('returns a full 24-hour window across midnight and seven days', () => {
    const w = normalizeWeather(fixture());
    expect(w.hourly).toHaveLength(24);
    expect(w.hourly[0].time).toBe('2026-09-15T23:00');
    expect(w.hourly[23].time).toBe('2026-09-16T22:00');
    expect(w.daily).toHaveLength(7);
  });
  it('keeps missing values null instead of claiming zero precipitation', () => {
    const w = normalizeWeather(fixture());
    expect(w.hourly[0].precipitation).toBeNull();
    expect(w.current.humidity).toBeNull();
    expect(w.daily[0].sunrise).toBeNull();
  });
  it('rejects malformed or missing current weather', () => {
    expect(() => normalizeWeather({})).toThrow();
    const f = fixture();
    f.current.temperature_2m = NaN;
    expect(() => normalizeWeather(f)).toThrow();
  });
  it('rejects stale hourly timelines', () => {
    const f = fixture();
    f.current.time = '2026-10-15T23:45';
    expect(() => normalizeWeather(f)).toThrow('过期');
  });
  it('validates saved coordinates', () => {
    expect(isCity({ id: 'x', name: 'x', latitude: null, longitude: 104 })).toBe(false);
    expect(isCity({ id: 'x', name: 'x', latitude: 91, longitude: 104 })).toBe(false);
    expect(isCity({ id: 'x', name: 'x', latitude: 30, longitude: 104 })).toBe(true);
  });
});
