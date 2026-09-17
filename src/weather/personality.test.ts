import { describe, expect, it } from 'vitest';
import { dialogueCount, getDialogue, weatherDialogues } from './weatherDialogue';
import { companionReplies, xitang } from './xitangPersonality';
import { catScenes, readySceneCount, sceneAsset } from './catSceneMapping';

describe('Xitang identity, authored dialogue and scene assets', () => {
  it('retains the family and food preferences provided by the user', () => {
    expect(xitang.pronoun).toBe('她');
    expect(xitang.mom).toBe('左凡妈妈');
    expect(xitang.brother).toBe('寇大哥');
    expect(xitang.favorites).toEqual(['虾子', '罐头']);
  });
  it('has at least 10 independently written lines per weather, with 143 lines overall', () => {
    for (const lines of Object.values(weatherDialogues)) {
      expect(lines.length).toBeGreaterThanOrEqual(10);
      expect(new Set(lines).size).toBe(lines.length);
    }
    expect(dialogueCount + Object.values(companionReplies).flat().length).toBe(143);
  });
  it('never repeats any of the six recent lines when more choices exist', () => {
    const current = { temperature: 20, time: '2026-09-15T14:00' };
    const recent = weatherDialogues.overcast.slice(0, 6);
    for (const random of [0, 0.15, 0.5, 0.99])
      expect(recent).not.toContain(getDialogue('overcast', current, () => random, recent));
  });
  it('uses unique images for all twelve weather scenes, including cloudy versus overcast', () => {
    const assets = Object.values(catScenes).map(sceneAsset);
    expect(assets.every((asset) => typeof asset.src === 'string' && asset.src.length > 0)).toBe(
      true,
    );
    expect(new Set(assets.map((asset) => asset.src)).size).toBe(12);
    expect(sceneAsset(catScenes.cloudy).src).not.toBe(sceneAsset(catScenes.overcast).src);
  });
  it('reports completed compositions honestly instead of hiding original-photo fallbacks', () => {
    expect(readySceneCount).toBe(12);
    const original = Object.values(catScenes)
      .filter((scene) => sceneAsset(scene).isPlaceholder)
      .map((scene) => scene.id);
    expect(original).toEqual([]);
  });
});
