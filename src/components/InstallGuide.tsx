import { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone } from 'lucide-react';

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
export function InstallGuide() {
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const query = window.matchMedia('(display-mode: standalone)');
    const update = () => setInstalled(standalone());
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return (
    <section className="glass install-guide">
      <Smartphone size={22} />
      <div>
        <h2>{installed ? '喜糖已经住进你的主屏幕' : '把喜糖放进 iPhone 主屏幕'}</h2>
        {installed ? (
          <p>下次直接点喜糖头像，就能看看天气、听她说一句话。</p>
        ) : (
          <ol>
            <li>用 iPhone 的 Safari 打开喜糖天气。</li>
            <li>
              轻点浏览器的分享按钮 <Share size={16} />。
            </li>
            <li>
              选择「添加到主屏幕」
              <PlusSquare size={16} />
              ，再点「添加」。若有「作为网页 App 打开」选项，请保持开启。
            </li>
          </ol>
        )}
        <p className="install-note">
          首次联网打开后，会保存页面和场景。离线天气只显示 24
          小时内的本机缓存；恢复网络后自动刷新。主屏幕 App 与 Safari 的收藏可能独立保存。
        </p>
        {!window.isSecureContext && (
          <p className="install-note">
            当前是本地 HTTP 预览；请使用正式 HTTPS 网址安装，才能使用定位和离线打开。
          </p>
        )}
      </div>
    </section>
  );
}
