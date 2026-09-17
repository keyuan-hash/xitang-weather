import { useCallback, useEffect, useRef, useState } from 'react';
import type { AirQuality, City, Weather } from '../types/weather';
import { fetchAirQuality, fetchWeather } from '../services/weatherApi';
import { readStorage, writeStorage } from '../lib/storage';
const cacheKey = (city: City) => `weather:${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`;
function getCache(city: City) {
  const value = readStorage<Weather | null>(cacheKey(city), null);
  return value &&
    typeof value.fetchedAt === 'number' &&
    Date.now() - value.fetchedAt < 86400000 &&
    value.current &&
    Array.isArray(value.hourly) &&
    Array.isArray(value.daily) &&
    value.daily.length >= 7
    ? value
    : null;
}
export function useWeather(city: City) {
  const [state, setState] = useState<{
    cityKey: string;
    data: Weather | null;
    loading: boolean;
    error: string | null;
    cached: boolean;
  }>({
    cityKey: cacheKey(city),
    data: getCache(city),
    loading: true,
    error: null,
    cached: !!getCache(city),
  });
  const [air, setAir] = useState<{ cityKey: string; data: AirQuality | null; loading: boolean }>({
    cityKey: cacheKey(city),
    data: null,
    loading: true,
  });
  const [refreshToken, setRefreshToken] = useState(0);
  const lastRefresh = useRef(0);
  const refresh = useCallback(() => {
    if (Date.now() - lastRefresh.current < 1500) return;
    lastRefresh.current = Date.now();
    setRefreshToken((n) => n + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController(),
      key = cacheKey(city),
      cached = getCache(city);
    setState({ cityKey: key, data: cached, loading: true, error: null, cached: !!cached });
    setAir({ cityKey: key, data: null, loading: true });
    fetchWeather(city, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        writeStorage(key, data);
        setState({ cityKey: key, data, loading: false, error: null, cached: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({
          cityKey: key,
          data: cached,
          loading: false,
          error: cached
            ? '连接暂时中断，正在显示上次保存的天气。'
            : '暂时连接不到天气服务，请检查网络后重试。',
          cached: !!cached,
        });
      });
    fetchAirQuality(city, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setAir({ cityKey: key, data, loading: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAir({ cityKey: key, data: null, loading: false });
      });
    return () => controller.abort();
  }, [city.latitude, city.longitude, refreshToken]);
  useEffect(() => {
    const id = setInterval(refresh, 15 * 60 * 1000);
    const online = () => refresh();
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  const key = cacheKey(city);
  return {
    ...(state.cityKey === key ? state : { data: null, loading: true, error: null, cached: false }),
    air: air.cityKey === key ? air.data : null,
    airLoading: air.cityKey === key ? air.loading : true,
    refresh,
  };
}
