import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';
import { weatherCategory, weatherLabel } from '../weather/weatherMapping';
export function WeatherIcon({
  code,
  isDay = true,
  size = 28,
}: {
  code: number | null;
  isDay?: boolean;
  size?: number;
}) {
  const category = weatherCategory(code);
  const icons = {
    clear: isDay ? Sun : Moon,
    cloudy: isDay ? CloudSun : CloudMoon,
    overcast: Cloud,
    rain: CloudDrizzle,
    'heavy-rain': CloudRain,
    thunderstorm: CloudLightning,
    snow: CloudSnow,
    fog: CloudFog,
    unknown: Cloud,
  };
  const Icon = icons[category];
  return (
    <Icon
      size={size}
      strokeWidth={1.65}
      className={`weather-icon icon-${category} ${!isDay ? 'icon-night' : ''}`}
      aria-label={weatherLabel(code)}
    />
  );
}
