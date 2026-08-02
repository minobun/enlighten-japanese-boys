// 効果音(SE)の再生フレームを EpisodeLayout から導出する(docs/spec.md §13 / Issue #17)。
// フレーム数の直書き禁止(CLAUDE.md)は SE にも適用するため、再生位置は全て #11 の
// SceneLayout(シーン開始フレーム・ブロック切り替えフレーム)から計算する。

import type { EpisodeLayout } from "./metadata";

export type SeCues = {
  // stamp.wav: 標識が prohibit で登場する瞬間(Item の宣告ブロック = Item シーンの開始)
  stamp: number[];
  // switch.wav: 標識が prohibit → instruct に切り替わる瞬間(action ブロックの開始)
  signSwitch: number[];
  // page.wav: シーン切り替わり(Hook→Item1、Item間、→Outro)
  page: number[];
};

export const buildSeCues = (layout: EpisodeLayout): SeCues => {
  const itemStarts = layout.items.map((item) => item.from);

  return {
    stamp: itemStarts,
    signSwitch: layout.items.map((item) => item.from + item.blocks.action.from),
    page: [...itemStarts, layout.outro.from],
  };
};
