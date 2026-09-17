import type { Category, CurrentWeather, SceneId } from '../types/weather';
const codes: Record<number, Category> = {
  0: 'clear',
  1: 'clear',
  2: 'cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'rain',
  53: 'rain',
  55: 'rain',
  56: 'rain',
  57: 'rain',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'rain',
  67: 'heavy-rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'heavy-rain',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};
export const categoryLabels: Record<Category, string> = {
  clear: '晴朗',
  cloudy: '多云',
  overcast: '阴天',
  rain: '小雨',
  'heavy-rain': '大雨',
  thunderstorm: '雷暴',
  snow: '下雪',
  fog: '大雾',
  unknown: '天气数据暂缺',
};
const detailLabels: Record<number, string> = {
  1: '晴间多云',
  51: '毛毛雨',
  53: '毛毛雨',
  55: '较强毛毛雨',
  56: '冻毛毛雨',
  57: '冻毛毛雨',
  63: '中雨',
  66: '冻雨',
  67: '强冻雨',
  80: '阵雨',
  81: '较强阵雨',
  82: '强阵雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '米雪',
  85: '阵雪',
  86: '强阵雪',
  96: '雷暴伴冰雹',
  99: '强雷暴伴冰雹',
};
export function weatherCategory(code: number | null): Category {
  return code == null ? 'unknown' : (codes[code] ?? 'unknown');
}
export function weatherLabel(code: number | null) {
  return code == null
    ? categoryLabels.unknown
    : (detailLabels[code] ?? categoryLabels[weatherCategory(code)]);
}
type Rule = {
  matches: (c: CurrentWeather, cat: Category) => boolean;
  scene: SceneId | ((c: CurrentWeather, cat: Category) => SceneId);
};
// Precipitation / visibility take priority over heat and wind; thunder is never hidden by night.
const rules: Rule[] = [
  { matches: (_, cat) => cat === 'thunderstorm', scene: 'thunderstorm' },
  { matches: (_, cat) => cat === 'snow', scene: 'snow' },
  { matches: (_, cat) => cat === 'heavy-rain', scene: 'heavy-rain' },
  { matches: (_, cat) => cat === 'rain', scene: (c) => (c.isDay ? 'rain' : 'night-rain') },
  { matches: (_, cat) => cat === 'fog', scene: 'fog' },
  { matches: (c) => (c.windSpeed ?? 0) >= 39, scene: 'wind' },
  { matches: (c) => (c.temperature ?? -100) >= 35, scene: 'hot' },
  { matches: (c) => !c.isDay, scene: 'night' },
  { matches: (_, cat) => cat === 'clear', scene: 'sunny' },
  { matches: (_, cat) => cat === 'cloudy', scene: 'cloudy' },
];
export function resolveWeather(c: CurrentWeather) {
  const category = weatherCategory(c.code);
  const rule = rules.find((r) => r.matches(c, category));
  const scene =
    typeof rule?.scene === 'function' ? rule.scene(c, category) : (rule?.scene ?? 'overcast');
  return { category, timeOfDay: c.isDay ? ('day' as const) : ('night' as const), scene };
}
