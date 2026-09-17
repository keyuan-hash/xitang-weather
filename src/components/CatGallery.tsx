import { useState } from 'react';
import { Heart, Moon, RefreshCw, UtensilsCrossed, Sparkles } from 'lucide-react';
import { avatar, catScenes, sceneAsset, readySceneCount } from '../weather/catSceneMapping';
import { getDialogue } from '../weather/weatherDialogue';
import { companionReplies, xitang, type CompanionAction } from '../weather/xitangPersonality';
import type { SceneId } from '../types/weather';
import { CatScene } from './CatScene';

export function CatGallery({ animation }: { animation: boolean }) {
  const [preview, setPreview] = useState<SceneId>('sunny');
  const [previewLine, setPreviewLine] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [reply, setReply] = useState(companionReplies.company[0]);
  const [action, setAction] = useState<CompanionAction>('company');
  const [replyRecent, setReplyRecent] = useState<string[]>([reply]);
  const scene = catScenes[preview];
  const context = {
    temperature: preview === 'hot' ? 36 : 20,
    time: preview === 'night' || preview === 'night-rain' ? '2026-01-01T22:00' : '2026-01-01T12:00',
  };
  const line = previewLine || getDialogue(preview, context, () => 0);
  const changeScene = (id: SceneId) => {
    setPreview(id);
    setPreviewLine('');
    setRecent([]);
  };
  const nextLine = () => {
    const next = getDialogue(preview, context, Math.random, [line, ...recent]);
    setPreviewLine(next);
    setRecent([...recent.slice(-5), next]);
  };
  const interact = (kind: CompanionAction) => {
    const options = companionReplies[kind].filter((text) => !replyRecent.slice(-4).includes(text));
    const pool = options.length ? options : companionReplies[kind];
    const next = pool[Math.floor(Math.random() * pool.length)];
    setReply(next);
    setReplyRecent([...replyRecent.slice(-4), next]);
    setAction(kind);
  };
  return (
    <div className="page-content cat-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">HER LITTLE WORLD, WITH YOU IN IT</span>
          <h1>一只小猫的天气日常</h1>
          <p>会怕雷，会挑食，也会用小呼噜，认真地喜欢你们。</p>
        </div>
        <img className="page-cat-avatar" src={avatar} alt="喜糖的真实头像" />
      </div>
      <div className="cat-preview">
        <CatScene sceneId={preview} animation={animation} />
        <div className="preview-overlay">
          <span className="pill">
            <Sparkles size={13} />
            场景预览 · 非实时天气
          </span>
          <span className="scene-chapter">
            {String(Object.keys(catScenes).indexOf(preview) + 1).padStart(2, '0')} / 12
          </span>
          <h2>{scene.mood}</h2>
          <p>{scene.story}</p>
        </div>
      </div>
      <div className="gallery-dialogue">
        <img src={avatar} alt="喜糖" />
        <div>
          <span>喜糖悄悄说</span>
          <p aria-live="polite">{line}</p>
        </div>
        <button className="icon-button" onClick={nextLine} aria-label="再听一句喜糖台词">
          <RefreshCw size={17} />
        </button>
      </div>
      <div className="scene-picker-heading">
        <h2>换一种天气，看看她的小心情</h2>
        <span>十二种天气，十二段小日常</span>
      </div>
      <div className="scene-picker" aria-label="天气场景选择">
        {Object.values(catScenes).map((s) => {
          const asset = sceneAsset(s);
          return (
            <button
              key={s.id}
              aria-label={s.label}
              aria-pressed={s.id === preview}
              onClick={() => changeScene(s.id)}
            >
              <span className="scene-thumbnail">
                <img src={asset.src} alt="" loading="lazy" style={{ objectPosition: s.position }} />
                {asset.isPlaceholder && <small>真实照片</small>}
              </span>
              <span className="scene-tile-label">
                {s.label}
                <i />
              </span>
              <span className="scene-tile-note">{s.mood}</span>
            </button>
          );
        })}
      </div>
      <p className="gallery-note">
        十二种天气场景，均以喜糖真实照片为参考创作。
        {readySceneCount < 12 && `标注「真实照片」的 ${12 - readySceneCount} 种天气暂用原照。`}
      </p>
      <section className="xitang-profile glass">
        <div className="profile-portrait">
          <img src={avatar} alt="真实的喜糖" />
          <span>THIS IS ME, XITANG</span>
        </div>
        <div className="profile-intro">
          <span className="eyebrow">认识这只小猫</span>
          <h2>胆子小小，牵挂很多。</h2>
          <p>{xitang.introduction}</p>
          <div className="personality-tags">
            {xitang.traits.map((trait) => (
              <span key={trait}>{trait}</span>
            ))}
          </div>
          <div className="favorite-foods">
            <UtensilsCrossed size={17} />
            <span>心动菜单：{xitang.favorites.join(' · ')}</span>
          </div>
        </div>
      </section>
      <div className="family-grid">
        {xitang.family.map((person) => (
          <article key={person.name}>
            <Heart size={17} />
            <div>
              <span>{person.relationship}</span>
              <h3>{person.name}</h3>
              <p>{person.text}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="companion-conversation">
        <div className="conversation-heading">
          <span className="eyebrow">A SOFT LITTLE PAUSE</span>
          <h2>今天，让小猫陪你一会儿。</h2>
          <p>她不太会说大道理，只想靠你近一点。</p>
        </div>
        <div className="companion-response" role="status">
          <img src={avatar} alt="喜糖" />
          <p>{reply}</p>
        </div>
        <div className="companion-actions">
          <button aria-pressed={action === 'company'} onClick={() => interact('company')}>
            <Heart size={17} />
            陪陪喜糖
          </button>
          <button aria-pressed={action === 'snack'} onClick={() => interact('snack')}>
            <UtensilsCrossed size={17} />
            聊聊小零食
          </button>
          <button aria-pressed={action === 'nap'} onClick={() => interact('nap')}>
            <Moon size={17} />
            一起打个盹
          </button>
        </div>
      </section>
    </div>
  );
}
