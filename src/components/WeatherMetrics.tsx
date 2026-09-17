import {
  ArrowUpRight,
  Droplets,
  Leaf,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { AirQuality, Weather } from '../types/weather';
import { clockTime, number, temperature, windDirection } from '../lib/format';
export function aqiLabel(aqi: number | null | undefined) {
  if (aqi == null) return '暂无数据';
  return aqi <= 50
    ? '优'
    : aqi <= 100
      ? '良'
      : aqi <= 150
        ? '敏感人群不宜'
        : aqi <= 200
          ? '不健康'
          : aqi <= 300
            ? '很不健康'
            : '危险';
}
export function WeatherMetrics({
  weather,
  air,
  airLoading,
  unit,
}: {
  weather: Weather;
  air: AirQuality | null;
  airLoading: boolean;
  unit: 'c' | 'f';
}) {
  const c = weather.current,
    d = weather.daily[0];
  return (
    <div className="metrics-grid">
      <article className="glass metric">
        <h3>
          <Thermometer size={16} />
          体感温度
        </h3>
        <strong>{temperature(c.apparent, unit)}</strong>
        <p>实际气温 {temperature(c.temperature, unit)}</p>
        <div className="metric-decoration heat-line" />
      </article>
      <article className="glass metric">
        <h3>
          <Umbrella size={16} />
          降水概率
        </h3>
        <strong>{number(weather.hourly[0]?.precipitation, '%')}</strong>
        <p>当前小时 · 今日最高 {number(d.precipitation, '%')}</p>
        <div className="meter">
          <i style={{ width: `${weather.hourly[0]?.precipitation ?? 0}%` }} />
        </div>
      </article>
      <article className="glass metric">
        <h3>
          <Droplets size={16} />
          相对湿度
        </h3>
        <strong>{number(c.humidity, '%')}</strong>
        <p>
          {c.humidity == null
            ? '等待湿度数据'
            : c.humidity > 75
              ? '空气有些湿润'
              : c.humidity < 35
                ? '空气偏干燥'
                : '空气湿度适中'}
        </p>
        <div className="meter">
          <i style={{ width: `${c.humidity ?? 0}%` }} />
        </div>
      </article>
      <article className="glass metric wind-metric">
        <h3>
          <Wind size={16} />
          风速与风向
        </h3>
        <strong>
          {number(c.windSpeed)}
          <small> km/h</small>
        </strong>
        <p>{windDirection(c.windDirection)}</p>
        <div className="compass">
          <span>N</span>
          <ArrowUpRight
            style={{ transform: `rotate(${(c.windDirection ?? 0) - 45}deg)` }}
            size={29}
          />
        </div>
      </article>
      <article className="glass metric air-metric">
        <h3>
          <Leaf size={16} />
          空气质量 <small>US AQI</small>
        </h3>
        <strong>
          {airLoading ? '—' : number(air?.aqi)}{' '}
          <small className="aqi-label">{airLoading ? '更新中' : aqiLabel(air?.aqi)}</small>
        </strong>
        <p>{air?.pm25 != null ? `PM2.5 ${air.pm25.toFixed(1)} µg/m³` : '空气质量暂不可用'}</p>
        <div className="aqi-scale">
          <i style={{ left: `${Math.min(98, ((air?.aqi ?? 0) / 300) * 100)}%` }} />
        </div>
      </article>
      <article className="glass metric sun-metric">
        <h3>
          <Sunrise size={16} />
          日出与日落
        </h3>
        <div className="sun-times">
          <div>
            <strong>{clockTime(d.sunrise)}</strong>
            <p>日出</p>
          </div>
          <Sunset size={26} />
          <div>
            <strong>{clockTime(d.sunset)}</strong>
            <p>日落</p>
          </div>
        </div>
        <svg viewBox="0 0 230 35" aria-hidden="true">
          <path
            d="M5 32Q115-25 225 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
          <path d="M5 32H225" stroke="currentColor" opacity=".3" />
        </svg>
      </article>
    </div>
  );
}
