import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Cat,
  ChevronDown,
  CloudSun,
  Heart,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Settings2,
  Star,
  X,
} from 'lucide-react';
import type { City, Settings as UserSettings } from './types/weather';
import { DEFAULT_CITY, isCity, locateCity } from './services/weatherApi';
import { useWeather } from './hooks/useWeather';
import { readStorage, writeStorage } from './lib/storage';
import { clockTime, dateLabel, temperature } from './lib/format';
import { resolveWeather, weatherLabel } from './weather/weatherMapping';
import { useXitangDialogue } from './hooks/useXitangDialogue';
import { avatar, catScenes } from './weather/catSceneMapping';
import { CatScene } from './components/CatScene';
import { WeatherIcon } from './components/WeatherIcon';
import { HourlyForecast, DailyForecast } from './components/Forecast';
import { WeatherMetrics, aqiLabel } from './components/WeatherMetrics';
import { Cities } from './components/Cities';
import { Settings } from './components/Settings';
import { CatGallery } from './components/CatGallery';
type Tab = 'weather' | 'cities' | 'cat' | 'settings';
const tabs = [
  { id: 'weather' as const, label: '天气', icon: CloudSun },
  { id: 'cities' as const, label: '城市', icon: MapPin },
  { id: 'cat' as const, label: '喜糖', icon: Cat },
  { id: 'settings' as const, label: '设置', icon: Settings2 },
];
export default function App() {
  const [tab, setTab] = useState<Tab>('weather');
  const [city, setCity] = useState(() => readStorage('city', DEFAULT_CITY, isCity));
  const [saved, setSaved] = useState(() =>
    readStorage<City[]>(
      'cities',
      [DEFAULT_CITY],
      (v): v is City[] => Array.isArray(v) && v.every(isCity),
    ),
  );
  const [settings, setSettings] = useState(() =>
    readStorage<UserSettings>(
      'settings',
      { unit: 'c', animation: true },
      (v): v is UserSettings =>
        !!v &&
        typeof v === 'object' &&
        ['c', 'f'].includes((v as UserSettings).unit) &&
        typeof (v as UserSettings).animation === 'boolean',
    ),
  );
  const [locating, setLocating] = useState(false),
    [notice, setNotice] = useState('');
  const { data: weather, air, airLoading, loading, error, cached, refresh } = useWeather(city);
  const mapping = weather ? resolveWeather(weather.current) : null;
  const { dialogue, nextDialogue } = useXitangDialogue(mapping?.scene, weather?.current);
  const selectCity = (c: City) => {
    setCity(c);
    writeStorage('city', c);
    setTab('weather');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const saveCity = (c: City) => {
    if (saved.some((item) => item.id === c.id)) return;
    const next = [...saved, c];
    setSaved(next);
    writeStorage('cities', next);
    setNotice(`已收藏${c.name}`);
  };
  const removeCity = (id: string) => {
    const next = saved.filter((c) => c.id !== id);
    setSaved(next);
    writeStorage('cities', next);
  };
  const updateSettings = (s: UserSettings) => {
    setSettings(s);
    writeStorage('settings', s);
  };
  const locate = async () => {
    setLocating(true);
    setNotice('');
    try {
      selectCity(await locateCity());
    } catch (e) {
      selectCity(DEFAULT_CITY);
      setNotice(e instanceof Error ? e.message : '定位失败，已切换成都。');
    } finally {
      setLocating(false);
    }
  };
  const goTab = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  return (
    <div
      data-scene={mapping?.scene}
      className={`app-shell ${mapping?.timeOfDay === 'night' && tab === 'weather' ? 'night-mode' : ''}`}
    >
      <header className="app-header">
        <button className="brand" onClick={() => goTab('weather')} aria-label="喜糖天气首页">
          <span className="brand-mark">
            <img src={avatar} alt="喜糖的真实头像" />
          </span>
          <span>
            <strong>喜糖天气</strong>
            <small>XITANG WEATHER</small>
          </span>
        </button>
        <nav className="desktop-nav" aria-label="主导航">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => goTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <span className="header-motto">
          一点天气，一点小确幸 <Heart size={13} />
        </span>
      </header>
      <main>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button aria-label="关闭提示" className="icon-button" onClick={() => setNotice('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {tab === 'weather' && (
          <div className="weather-page">
            <div className="location-bar">
              <button className="city-title" onClick={() => goTab('cities')}>
                <MapPin size={19} />
                <h1>{city.name}</h1>
                <ChevronDown size={16} />
                <span>{city.region && city.region !== city.name ? city.region : ''}</span>
              </button>
              <div className="location-actions">
                <span className="updated">
                  {loading
                    ? '正在更新天气'
                    : weather
                      ? `${cached ? '缓存 · ' : ''}${clockTime(weather.current.time)} 更新`
                      : '等待连接'}
                </span>
                <button
                  className="icon-button"
                  aria-label="刷新天气"
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw size={17} className={loading ? 'spinning' : ''} />
                </button>
                <button
                  className="icon-button"
                  aria-label="使用当前位置"
                  onClick={locate}
                  disabled={locating}
                >
                  {locating ? (
                    <LoaderCircle size={18} className="spinning" />
                  ) : (
                    <LocateFixed size={18} />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="添加城市"
                  onClick={() => goTab('cities')}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                <span>
                  {error}
                  {cached && weather && ` 数据时间：${weather.current.time.replace('T', ' ')}。`}
                </span>
                <button onClick={refresh}>重新连接</button>
              </div>
            )}
            {weather && mapping ? (
              <>
                <section
                  className={`weather-hero hero-${mapping.scene}`}
                  aria-label="当前天气和喜糖场景"
                >
                  <CatScene sceneId={mapping.scene} animation={settings.animation} />
                  <div className="hero-weather">
                    <span className="hero-date">{dateLabel(weather.current.time, true)}</span>
                    <div className="temperature-row">
                      <span className="main-temperature">
                        {temperature(weather.current.temperature, settings.unit)}
                      </span>
                      <WeatherIcon
                        code={weather.current.code}
                        isDay={weather.current.isDay}
                        size={57}
                      />
                    </div>
                    <h2>{weatherLabel(weather.current.code)}</h2>
                    <div className="hero-feels">
                      体感 {temperature(weather.current.apparent, settings.unit)} <span />{' '}
                      {air?.aqi != null
                        ? `空气${aqiLabel(air.aqi)} · ${Math.round(air.aqi)} US AQI`
                        : '空气质量待更新'}
                    </div>
                    <div className="hero-high-low">
                      <span>
                        <ArrowUp size={14} />
                        {temperature(weather.daily[0].high, settings.unit)}
                      </span>
                      <span>
                        <ArrowDown size={14} />
                        {temperature(weather.daily[0].low, settings.unit)}
                      </span>
                    </div>
                    <div className="hero-quote">
                      <span>喜糖的天气日记</span>
                      <p>{catScenes[mapping.scene].story}</p>
                    </div>
                  </div>
                  <div className="hero-signature">
                    喜糖<span>天气 ♡</span>
                  </div>
                  <div className="hero-bottom">
                    <span>
                      <span className="live-dot" />
                      {cached ? '上次保存的天气' : '此刻的天气，此刻的陪伴'}
                    </span>
                    <button onClick={() => goTab('cat')}>
                      看看她的天气小日常 <ArrowUpRight size={15} />
                    </button>
                  </div>
                </section>
                <section className="dialogue-card">
                  <img src={avatar} alt="喜糖头像" />
                  <div>
                    <h2>
                      喜糖悄悄说 <span>给左凡妈妈和寇大哥</span>
                    </h2>
                    <p>{dialogue}</p>
                  </div>
                  <button
                    className="icon-button"
                    onClick={nextDialogue}
                    aria-label="换一句喜糖台词"
                  >
                    <RefreshCw size={17} />
                  </button>
                </section>
                <div className="content-heading">
                  <h2>今天，慢慢来</h2>
                  <span>把天气交给喜糖，把日子过成喜欢的样子。</span>
                </div>
                <WeatherMetrics
                  weather={weather}
                  air={air}
                  airLoading={airLoading}
                  unit={settings.unit}
                />
                <HourlyForecast weather={weather} unit={settings.unit} />
                <div className="forecast-bottom">
                  <DailyForecast weather={weather} unit={settings.unit} />
                  <aside className="companion-card">
                    <span className="eyebrow">A LITTLE COMPANY, EVERY DAY</span>
                    <img className="companion-avatar" src={avatar} alt="喜糖" />
                    <h2>
                      晴也好，雨也好。
                      <br />
                      小猫都在等你。
                    </h2>
                    <p>
                      胆子小一点，喜欢你们多一点。
                      <br />
                      想虾子，也想左凡妈妈和寇大哥。
                    </p>
                    <button onClick={() => goTab('cat')}>
                      走进喜糖的小世界 <ArrowUpRight size={16} />
                    </button>
                    <span className="companion-paw">
                      <Heart size={83} strokeWidth={0.7} />
                    </span>
                  </aside>
                </div>
              </>
            ) : (
              <section className="loading-weather glass">
                <img src={avatar} alt="等待天气的喜糖" />
                {loading ? (
                  <>
                    <LoaderCircle size={26} className="spinning" />
                    <h2>喜糖正在探头看天气…</h2>
                    <p>正在连接 {city.name} 的天空</p>
                  </>
                ) : (
                  <>
                    <h2>暂时没连上这片天空</h2>
                    <p>检查网络后重试，喜糖会在这里等你。</p>
                    <button className="primary-button" onClick={refresh}>
                      重新获取天气
                    </button>
                  </>
                )}
              </section>
            )}
            {weather && !saved.some((c) => c.id === city.id) && (
              <button className="save-current" onClick={() => saveCity(city)}>
                <Star size={15} />
                收藏{city.name}，下次更快找到
              </button>
            )}
          </div>
        )}
        {tab === 'cities' && (
          <Cities
            selected={city}
            saved={saved}
            onSelect={selectCity}
            onSave={saveCity}
            onRemove={removeCity}
            onLocate={locate}
            locating={locating}
          />
        )}
        {tab === 'cat' && <CatGallery animation={settings.animation} />}
        {tab === 'settings' && <Settings settings={settings} onChange={updateSettings} />}
      </main>
      <footer className="app-footer">
        <span>
          <Heart size={12} /> 每一种天气，都有喜糖陪你。
        </span>
        <span>
          天气数据{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          · 空气质量 CAMS{weather ? ` · ${weather.timezone}` : ''}
        </span>
      </footer>
      <nav className="bottom-nav" aria-label="底部导航">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => goTab(id)}>
            <Icon size={21} />
            <span>{label}</span>
            {tab === id && <i />}
          </button>
        ))}
      </nav>
    </div>
  );
}
