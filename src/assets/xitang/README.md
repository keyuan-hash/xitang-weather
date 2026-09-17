# 喜糖天气场景素材

将生成好的喜糖素材直接放入本目录。不要放在 `placeholders/` 里。

| 天气 | 首选文件名          | 备用格式                  |
| ---- | ------------------- | ------------------------- |
| 晴天 | `sunny.webp`        | `.png` / `.jpg` / `.jpeg` |
| 多云 | `cloudy.webp`       | 同上                      |
| 阴天 | `overcast.webp`     | 同上                      |
| 小雨 | `rain.webp`         | 同上                      |
| 大雨 | `heavy-rain.webp`   | 同上                      |
| 雷暴 | `thunderstorm.webp` | 同上                      |
| 雪天 | `snow.webp`         | 同上                      |
| 雾天 | `fog.webp`          | 同上                      |
| 大风 | `wind.webp`         | 同上                      |
| 夜晚 | `night.webp`        | 同上                      |
| 夜雨 | `night-rain.webp`   | 同上                      |
| 高温 | `hot.webp`          | 同上                      |

文件名区分大小写。加载优先级：本目录用户素材（WebP → PNG → JPG → JPEG）→ `scenes-v2/` 中的场景 → `placeholders/` 中该天气专属的真实照片。新增/替换后 Vite 自动刷新；如未刷新，重启 `npm run dev`。生产版本需重新 `npm run build`。

第二版推荐 **完整、光线统一的场景图**，而非只抠出的猫。建议 1536×1024，主体中心在横向 60%–68%，猫脸和双耳完整，左侧留自然安静背景承载天气文字。手机采用中右侧取景，场景焦点在 `catSceneMapping.ts` 的 `position`、`mobilePosition` 配置中，页面不包含选图判断。透明素材仍可加载，但会显示在场景底色上；要有自然环境，应提供完整场景图。

`scenes-v2/` 已有全部 12 张独立 Image 2 场景。新增小雨透明伞、大雨屋檐、雷暴窗边和高温四脚朝天，均已核验生成 PNG 的 gpt-image 2.0 元数据。原照仅作为资源异常时的安全回退。

`avatar.svg` 与 `public/favicon.svg` 内嵌喜糖的原始 JPEG，通过 SVG 的视口和圆形裁切显示真实猫脸；没有生成替代头像，也没有修改原图。

场景设计与 AI 协作方式见 `docs/portfolio-case-study.md`。天气阈值在 `weatherMapping.ts`，场景配置在 `catSceneMapping.ts`，125 句天气/时段台词在 `weatherDialogue.ts`，18 句互动台词和家庭设定在 `xitangPersonality.ts`。
