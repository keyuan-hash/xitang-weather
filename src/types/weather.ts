export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
}
export type Category =
  | 'clear'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'unknown';
export type SceneId =
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'wind'
  | 'night'
  | 'night-rain'
  | 'hot';
export interface CurrentWeather {
  time: string;
  temperature: number | null;
  apparent: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  code: number | null;
  isDay: boolean;
}
export interface HourWeather {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  code: number | null;
  isDay: boolean;
}
export interface DayWeather {
  date: string;
  high: number | null;
  low: number | null;
  precipitation: number | null;
  code: number | null;
  sunrise: string | null;
  sunset: string | null;
  uv: number | null;
}
export interface Weather {
  current: CurrentWeather;
  hourly: HourWeather[];
  daily: DayWeather[];
  timezone: string;
  fetchedAt: number;
}
export interface AirQuality {
  aqi: number | null;
  pm25: number | null;
  time: string;
}
export interface Settings {
  unit: 'c' | 'f';
  animation: boolean;
}
