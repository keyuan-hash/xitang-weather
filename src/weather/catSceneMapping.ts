import type { SceneId } from '../types/weather';
import originalAvatar from '../assets/xitang/avatar.svg';

export interface CatScene {
  id: SceneId;
  label: string;
  mood: string;
  story: string;
  description: string;
  asset: string;
  fallback: string;
  position: string;
  mobilePosition: string;
  ambient:
    | 'sunlight'
    | 'daylight'
    | 'still'
    | 'window'
    | 'storm'
    | 'winter'
    | 'mist'
    | 'breeze'
    | 'moonlight'
    | 'heat';
}
const photos = import.meta.glob('../assets/xitang/placeholders/*.jpeg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const custom = import.meta.glob('../assets/xitang/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const generated = import.meta.glob('../assets/xitang/scenes-v2/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

type SceneSpec = [SceneId, string, string, string, string, string, string, CatScene['ambient']];
const data: SceneSpec[] = [
  [
    'sunny',
    '晴天',
    '晒暖了，分你一半',
    '阳光落在毛尖上，午睡就有了慢慢来的理由。',
    'sunny',
    '64% 45%',
    '72% 50%',
    'sunlight',
  ],
  [
    'cloudy',
    '多云',
    '那朵云，像不像虾子',
    '抬头看云的小猫，偷偷把天空当成了今日菜单。',
    'cloudy',
    '61% 24%',
    '65% 50%',
    'daylight',
  ],
  [
    'overcast',
    '阴天',
    '今天趴着陪你',
    '下巴枕着小爪爪，心事和灰天都可以慢慢放下。',
    'overcast',
    '64% 46%',
    '67% 50%',
    'still',
  ],
  [
    'rain',
    '小雨',
    '干燥的地方等你',
    '有一点怕湿爪爪，也有一点惦记你带没带伞。',
    'sitting',
    '68% 48%',
    '70% 50%',
    'window',
  ],
  [
    'heavy-rain',
    '大雨',
    '往屋里再缩一点',
    '雨声大了，胆小的她最想听见左凡妈妈的声音。',
    'shelter',
    '68% 48%',
    '73% 50%',
    'window',
  ],
  [
    'thunderstorm',
    '雷暴',
    '寇大哥，陪我一下',
    '耳朵竖起来了。轻轻陪着，比突然抱起她更安心。',
    'alert',
    '68% 48%',
    '70% 50%',
    'storm',
  ],
  [
    'snow',
    '下雪',
    '围巾暖暖，心也暖暖',
    '雪光照亮胡须，左凡妈妈的惦记藏在暖暖围巾里。',
    'snow',
    '62% 22%',
    '61% 50%',
    'winter',
  ],
  [
    'fog',
    '大雾',
    '小心翼翼，向你走来',
    '先探一只爪爪。远处不清楚，就把眼前一步走稳。',
    'fog',
    '62% 20%',
    '61% 50%',
    'mist',
  ],
  [
    'wind',
    '大风',
    '我的胡须有自己的想法',
    '风掀起窗帘，也吹乱了毛。小猫努力站得稳稳的。',
    'wind',
    '62% 22%',
    '61% 50%',
    'breeze',
  ],
  [
    'night',
    '夜晚',
    '月亮值班，小猫打盹',
    '看一会儿月亮，就等左凡妈妈和寇大哥道晚安。',
    'night',
    '59% 24%',
    '64% 50%',
    'moonlight',
  ],
  [
    'night-rain',
    '夜雨',
    '雨在窗外，你在心里',
    '她蜷进干燥的毯子，把暖光和小呼噜留给家人。',
    'cozy',
    '65% 47%',
    '68% 50%',
    'window',
  ],
  [
    'hot',
    '高温',
    '躺平，也是一件正经事',
    '今天先不挑罐头了，挑一个凉快的地方等你回家。',
    'hot',
    '65% 55%',
    '70% 50%',
    'heat',
  ],
];
export const catScenes = Object.fromEntries(
  data.map(([id, label, mood, story, photo, position, mobilePosition, ambient]) => [
    id,
    {
      id,
      label,
      mood,
      story,
      description: `${label}里的喜糖：${story}`,
      asset: id,
      position,
      mobilePosition,
      ambient,
      fallback: photos[`../assets/xitang/placeholders/${photo}.jpeg`],
    },
  ]),
) as Record<SceneId, CatScene>;

/** Root-level user assets take precedence. Scenes-v2 are integrated photo compositions, not transparent sprites. */
export function sceneAsset(scene: CatScene) {
  for (const ext of ['webp', 'png', 'jpg', 'jpeg']) {
    const src = custom[`../assets/xitang/${scene.asset}.${ext}`];
    if (src) return { src, kind: 'custom' as const, isPlaceholder: false };
  }
  const src = generated[`../assets/xitang/scenes-v2/${scene.asset}.webp`];
  if (src) return { src, kind: 'composed' as const, isPlaceholder: false };
  return { src: scene.fallback, kind: 'original' as const, isPlaceholder: true };
}
export const avatar = originalAvatar;
export const readySceneCount = Object.values(catScenes).filter(
  (scene) => !sceneAsset(scene).isPlaceholder,
).length;
