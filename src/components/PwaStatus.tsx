import { useRegisterSW } from 'virtual:pwa-register/react';
import { X } from 'lucide-react';

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!offlineReady && !needRefresh) return null;
  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  return (
    <aside className="pwa-status glass" aria-label="应用更新" role="status">
      <div>
        <strong>{needRefresh ? '喜糖带来了新内容' : '喜糖已准备好离线陪你'}</strong>
        <p>
          {needRefresh
            ? '准备好时再更新，收藏和偏好会保留。'
            : '断网也能打开；最近保存的天气会标注时间。'}
        </p>
      </div>
      {needRefresh && (
        <button className="pwa-update" onClick={() => void updateServiceWorker(true)}>
          更新
        </button>
      )}
      <button className="icon-button" aria-label="关闭应用提示" onClick={dismiss}>
        <X size={18} />
      </button>
    </aside>
  );
}
