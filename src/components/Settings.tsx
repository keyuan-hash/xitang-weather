import { Info, SlidersHorizontal } from 'lucide-react';
import type { Settings as UserSettings } from '../types/weather';
import { InstallGuide } from './InstallGuide';
export function Settings({
  settings,
  onChange,
}: {
  settings: UserSettings;
  onChange: (s: UserSettings) => void;
}) {
  return (
    <div className="page-content settings-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>舒服一点，刚刚好</h1>
          <p>按你的习惯，调整喜糖的小世界。</p>
        </div>
        <SlidersHorizontal size={34} strokeWidth={1} />
      </div>
      <section className="glass settings-card">
        <div className="setting-row">
          <div>
            <h2>温度单位</h2>
            <p>当前天气和所有预报一起切换</p>
          </div>
          <div className="segmented">
            <button
              aria-pressed={settings.unit === 'c'}
              onClick={() => onChange({ ...settings, unit: 'c' })}
            >
              °C
            </button>
            <button
              aria-pressed={settings.unit === 'f'}
              onClick={() => onChange({ ...settings, unit: 'f' })}
            >
              °F
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h2>天气动画</h2>
            <p>让场景里的光线轻轻变化，安静陪着你</p>
          </div>
          <button
            className="switch"
            role="switch"
            aria-label="天气动画"
            aria-checked={settings.animation}
            onClick={() => onChange({ ...settings, animation: !settings.animation })}
          >
            <span />
          </button>
        </div>
        <p className="setting-footnote">如果系统已开启「减少动态效果」，喜糖会自动安静下来。</p>
      </section>
      <InstallGuide />
      <section className="glass about-card">
        <Info size={20} />
        <div>
          <h2>关于喜糖天气</h2>
          <p>每一种天气，都有喜糖陪你。</p>
          <p>
            天气与城市搜索由{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{' '}
            提供。空气质量来自{' '}
            <a
              href="https://open-meteo.com/en/docs/air-quality-api"
              target="_blank"
              rel="noreferrer"
            >
              CAMS / Open-Meteo
            </a>
            ，使用 US AQI 标准，与中国 AQI 标准不同。数据为模型估算，可能与当地观测存在差异。
          </p>
          <p>
            城市、偏好和最近天气仅保存在本机浏览器。点击定位才会请求位置权限，查询时会将坐标发送给天气服务。
          </p>
          <p>每 15 分钟更新 · 版本 1.2.0</p>
        </div>
      </section>
    </div>
  );
}
