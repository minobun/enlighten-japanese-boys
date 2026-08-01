// narration 行のキー命名規則(docs/spec.md §6.2)。
// 合成(scripts/synthesize.ts)・尺算出(src/metadata.ts)・再生(<Narration>)が
// 同じキーを見る必要があるため、規則の定義はこのファイル1箇所に集約する。

import type { Episode } from "./schema";

export type NarrationScene = {
  keyPrefix: string; // "hook" | `item${no}` | "outro"
  texts: string[];
};

export type NarrationLine = {
  key: string; // `${keyPrefix}_${通し番号}`。public/audio/{id}/{key}.wav に対応する
  text: string;
};

export const narrationKey = (keyPrefix: string, index: number): string =>
  `${keyPrefix}_${index + 1}`;

// エピソード内の narration を再生順(Hook → Item×3 → Outro)に並べる
export const narrationScenes = (episode: Episode): NarrationScene[] => [
  { keyPrefix: "hook", texts: episode.hookNarration },
  ...episode.items.map((item) => ({ keyPrefix: `item${item.no}`, texts: item.narration })),
  { keyPrefix: "outro", texts: episode.outroNarration },
];

export const narrationLines = (episode: Episode): NarrationLine[] =>
  narrationScenes(episode).flatMap((scene) =>
    scene.texts.map((text, index) => ({ key: narrationKey(scene.keyPrefix, index), text })),
  );
