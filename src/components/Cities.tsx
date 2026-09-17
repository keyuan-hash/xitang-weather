import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { City } from '../types/weather';
import { POPULAR_CITIES, searchCities } from '../services/weatherApi';
export function Cities({
  selected,
  saved,
  onSelect,
  onSave,
  onRemove,
  onLocate,
  locating,
}: {
  selected: City;
  saved: City[];
  onSelect: (city: City) => void;
  onSave: (city: City) => void;
  onRemove: (id: string) => void;
  onLocate: () => void;
  locating: boolean;
}) {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<City[]>([]),
    [searching, setSearching] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      setError('');
      return;
    }
    setSearching(true);
    setError('');
    setResults([]);
    const timer = setTimeout(() => {
      searchCities(query, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setResults(data);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError('城市搜索暂不可用，请重试，或选择下方常用城市。');
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <span className="eyebrow">A LITTLE CLOSER TO YOUR WORLD</span>
          <h1>你关心的城市</h1>
          <p>无论在哪里，都让喜糖陪你看天气。</p>
        </div>
        <MapPin size={38} strokeWidth={1} />
      </div>
      <div className="search-box">
        <Search size={20} />
        <input
          aria-label="搜索城市"
          placeholder="搜索城市名称，如成都、Tokyo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="icon-button" aria-label="清空搜索" onClick={() => setQuery('')}>
            <X size={17} />
          </button>
        )}
        {searching && <LoaderCircle className="spinning" size={20} />}
      </div>
      <button className="location-button" onClick={onLocate} disabled={locating}>
        <LocateFixed size={18} />
        {locating ? '正在获取位置…' : '使用我的当前位置'}
        <ArrowUpRight size={16} />
      </button>
      {query.trim().length >= 2 && (
        <section className="search-results" aria-live="polite">
          <h2>搜索结果</h2>
          {error && <p role="alert">{error}</p>}
          {!searching && !error && !results.length && <p>没有找到这个城市，试试全名或英文名称。</p>}
          {results.map((city) => (
            <div className="city-result" key={city.id}>
              <button onClick={() => onSelect(city)}>
                <MapPin size={18} />
                <span>
                  <strong>{city.name}</strong>
                  <small>
                    {[city.region, city.country].filter(Boolean).join(' · ')} ·{' '}
                    {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={`收藏${city.name}`}
                onClick={() => onSave(city)}
                disabled={saved.some((c) => c.id === city.id)}
              >
                {saved.some((c) => c.id === city.id) ? <Check size={19} /> : <Plus size={19} />}
              </button>
            </div>
          ))}
        </section>
      )}
      <div className="section-heading city-heading">
        <h2>
          <Star size={16} />
          常用城市
        </h2>
        <span>保存在这台设备上</span>
      </div>
      <div className="saved-grid">
        {saved.map((city, i) => (
          <article className={`saved-city city-color-${i % 3}`} key={city.id}>
            <button className="saved-city-select" onClick={() => onSelect(city)}>
              <span>
                {city.id === selected.id ? '正在查看' : '轻触查看天气'}
                {city.id === selected.id && <Check size={13} />}
              </span>
              <h3>{city.name}</h3>
              <p>{city.region || city.country || '已保存的位置'}</p>
              <ArrowUpRight className="city-arrow" size={24} />
            </button>
            <button
              className="remove-city"
              aria-label={`移除${city.name}`}
              onClick={() => onRemove(city.id)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
      {saved.length === 0 && (
        <p className="empty-state">还没有收藏城市。搜索城市后，点击加号收藏。</p>
      )}
      <div className="section-heading city-heading">
        <h2>发现一座城市</h2>
      </div>
      <div className="popular-cities">
        {POPULAR_CITIES.map((city) => (
          <button key={city.id} onClick={() => onSelect(city)}>
            {city.name}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
