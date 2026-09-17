import { CalendarDays, Clock3, Droplets } from 'lucide-react';
import type { Weather } from '../types/weather';
import { clockTime, dateLabel, number, temperature } from '../lib/format';
import { WeatherIcon } from './WeatherIcon';
import { weatherLabel } from '../weather/weatherMapping';
export function HourlyForecast({ weather, unit }: { weather: Weather; unit: 'c' | 'f' }) {
  return (
    <section className="glass hourly-card">
      <div className="section-heading">
        <h2>
          <Clock3 size={16} />
          24 小时预报
        </h2>
        <span>向左滑动，看看接下来的天气</span>
      </div>
      <div className="hourly-scroll" tabIndex={0} aria-label="24 小时天气，可横向滚动">
        {weather.hourly.map((h, i) => (
          <div className={`hour ${i === 0 ? 'current-hour' : ''}`} key={h.time}>
            <span className="hour-time">{i === 0 ? '现在' : clockTime(h.time)}</span>
            <WeatherIcon code={h.code} isDay={h.isDay} size={29} />
            <strong>{temperature(h.temperature, unit)}</strong>
            <small>
              <Droplets size={10} />
              {number(h.precipitation, '%')}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function DailyForecast({ weather, unit }: { weather: Weather; unit: 'c' | 'f' }) {
  const values = weather.daily
      .flatMap((d) => [d.low, d.high])
      .filter((v): v is number => v != null),
    min = Math.min(...values),
    max = Math.max(...values),
    range = Math.max(1, max - min);
  return (
    <section className="glass daily-card">
      <div className="section-heading">
        <h2>
          <CalendarDays size={16} />
          未来 7 天
        </h2>
        <span>日常有晴，也有雨</span>
      </div>
      <div className="daily-list">
        {weather.daily.map((d, i) => (
          <div className="day-row" key={d.date}>
            <span className="day-name">
              {i === 0 ? '今天' : i === 1 ? '明天' : dateLabel(d.date)}
            </span>
            <WeatherIcon code={d.code} size={23} />
            <span className="day-condition">{weatherLabel(d.code)}</span>
            <small className="day-rain">
              <Droplets size={11} />
              {number(d.precipitation, '%')}
            </small>
            <span className="low-temp">{temperature(d.low, unit)}</span>
            <div className="temp-track">
              {d.low != null && d.high != null && (
                <div
                  className="temp-range"
                  style={{
                    left: `${((d.low - min) / range) * 100}%`,
                    width: `${Math.max(3, ((d.high - d.low) / range) * 100)}%`,
                  }}
                />
              )}
            </div>
            <span>{temperature(d.high, unit)}</span>
          </div>
        ))}
      </div>
      <div className="forecast-note">温度条显示本周气温范围 · 每天都有喜糖陪你</div>
    </section>
  );
}
