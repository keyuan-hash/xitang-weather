export function temperature(value: number | null | undefined, unit: 'c' | 'f' = 'c') {
  return value == null ? '—' : `${Math.round(unit === 'f' ? (value * 9) / 5 + 32 : value)}°`;
}
export function number(value: number | null | undefined, suffix = '') {
  return value == null ? '—' : `${Math.round(value)}${suffix}`;
}
export function windDirection(deg: number | null) {
  return deg == null
    ? '风向暂无'
    : ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'][
        Math.round(deg / 45) % 8
      ];
}
// Open-Meteo ISO strings already represent the queried city's wall clock. Never parse them in the browser's timezone.
export function clockTime(time: string | null | undefined) {
  return time?.slice(11, 16) || '—';
}
export function dateLabel(date: string, full = false) {
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'UTC',
    ...(full ? { month: 'long' as const, day: 'numeric' as const } : {}),
    weekday: 'long',
  }).format(d);
}
