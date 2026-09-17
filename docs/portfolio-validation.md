# 喜糖天气：作品验证记录

更新于 **2026-09-17（中国标准时间）**。这份记录区分可复现的本地检查、当时的线上检查与尚未覆盖的情况。

## 本地可复现

在 Node.js 22.12+ 环境下，从项目根目录运行：

```bash
npm install
npm test
npm run test:gateway
npm run typecheck
npm run build
```

2026-09-17 实际结果：Vitest **62 项通过**，天气接口 **5 项通过**，TypeScript 检查与 Vite 生产构建通过。构建生成 PWA manifest、Service Worker 与 12 个场景资源。若要手动检查天气与城市搜索，运行 `npm run dev` 后打开浏览器中的本地地址。

项目还提供更深入的检查脚本：启动开发服务器后执行 `npm run test:browser`；生产构建和预览服务启动后执行 `npm run test:ios`。这些脚本使用 Playwright，首次运行可能需要安装对应浏览器。

## 当时的线上检查

- 正式网址：[https://xitangweather.cn](https://xitangweather.cn/)。2026-09-17 检查时可返回首页；手机尺寸浏览器能加载真实天气与喜糖场景，没有页面 JavaScript 错误。README 中的两张手机截图与演示视频取自正式网址。
- 大陆网络节点对首页、天气接口、城市查询分别做了 3 次请求，共 **9/9 次返回 HTTP 200**。节点覆盖北京、广州、上海与深圳；这证明检查当时这些请求可达，不能保证所有运营商、所有时段始终正常。
- 手机尺寸自动检查覆盖 24 小时、7 天预报、深圳搜索与切换、页面无横向溢出、同源天气请求、Service Worker 注册；没有记录到控制台或 JavaScript 错误。

## 产品边界

- iPhone 使用方式是 Safari 添加到主屏幕的 Web App；未上架 App Store，也未声称完成原生 iOS 包装。
- 天气来自 Open-Meteo 预报；空气质量使用 US AQI，不等同于中国 AQI，也不保证每个城市都有数据。
- 离线时只展示本机近期保存、带时间标记的天气；首次访问仍需网络。城市收藏与偏好不跨设备同步。
- 场景图片是根据喜糖真实照片辅助创作的插画；真实头像与插画在应用中有不同用途。
