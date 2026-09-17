import { useState, type CSSProperties } from 'react';
import { catScenes, sceneAsset } from '../weather/catSceneMapping';
import type { SceneId } from '../types/weather';

/** Weather exists in the authored scene. Motion is a subtle variation of its light, never rain over a dry indoor cat. */
export function CatScene({ sceneId, animation = true }: { sceneId: SceneId; animation?: boolean }) {
  const scene = catScenes[sceneId],
    asset = sceneAsset(scene);
  const [failed, setFailed] = useState<string | null>(null);
  const fallback = asset.isPlaceholder || failed === asset.src;
  return (
    <div
      className={`cat-scene weather-world world-${scene.id} ${fallback ? 'world-original' : 'world-composed'} ${animation ? '' : 'motion-off'}`}
      style={
        {
          '--scene-position': scene.position,
          '--scene-mobile-position': scene.mobilePosition,
        } as CSSProperties
      }
      data-asset-kind={fallback ? 'original' : asset.kind}
    >
      <img
        key={asset.src}
        className="cat-photo scene-photograph"
        src={failed === asset.src ? scene.fallback : asset.src}
        alt={fallback ? `喜糖真实照片，${scene.label}专用场景待补充` : scene.description}
        onError={() => setFailed(asset.src)}
        fetchPriority="high"
        decoding="async"
      />
      <div className="scene-readability" aria-hidden="true" />
      {animation && !fallback && (
        <div
          className={`weather-animation scene-ambience ambience-${scene.ambient}`}
          aria-hidden="true"
        />
      )}
      <div className="scene-caption">
        <span className="live-dot" />
        {scene.mood}
      </div>
      {fallback && <span className="original-photo-label">喜糖的真实照片</span>}
    </div>
  );
}
