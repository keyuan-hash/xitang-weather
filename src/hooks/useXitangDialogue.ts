import { useMemo, useState } from 'react';
import type { CurrentWeather, SceneId } from '../types/weather';
import { getDialogue } from '../weather/weatherDialogue';

export function useXitangDialogue(scene?: SceneId, current?: CurrentWeather) {
  const key = `${scene}:${current?.time.slice(0, 13)}:${current?.temperature != null && current.temperature <= 5 ? 'cold' : 'normal'}`;
  const initial = useMemo(
    () =>
      scene && current
        ? getDialogue(scene, current)
        : '寇大哥，等我探头看看天气。窗边的位置也给你留着。',
    [key],
  );
  const [choice, setChoice] = useState<{ key: string; text: string; recent: string[] }>({
    key: '',
    text: '',
    recent: [],
  });
  const dialogue = choice.key === key ? choice.text : initial;
  const nextDialogue = () => {
    if (!scene || !current) return;
    setChoice((previous) => {
      const recent = previous.key === key ? previous.recent : [initial];
      const text = getDialogue(scene, current, Math.random, recent.slice(-6));
      return { key, text, recent: [...recent.slice(-5), text] };
    });
  };
  return { dialogue, nextDialogue };
}
