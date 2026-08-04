// 標識が禁止(✕)→ 指示(✓)に切り替わるタイミングで差し替えられる値の共通ヘルパー
// (見出しとイラストが同じ形なので、取り出し方を1箇所にまとめる)。
// 1つだけ書かれている場合は「差し替えない」= prohibit も instruct も同じ値として扱う。

import type { Switchable } from "./schema";

export const prohibitValue = (value: Switchable): string =>
  typeof value === "string" ? value : value.prohibit;

export const instructValue = (value: Switchable): string =>
  typeof value === "string" ? value : value.instruct;

// 行数チェック等で「この値が取りうる文字列」を全部見たいとき用(重複は除く)
export const switchableValues = (value: Switchable): string[] => {
  const prohibit = prohibitValue(value);
  const instruct = instructValue(value);
  return prohibit === instruct ? [prohibit] : [prohibit, instruct];
};
