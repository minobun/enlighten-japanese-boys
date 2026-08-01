// デザイントークン。色・フォントサイズ・行数上限・セーフエリアはこのファイルに集約する(docs/spec.md §5.1, §5.2, §3)。
// このファイル以外に色コードを直書きすることを禁止する。

export const color = {
  ground: "#0E1524", // 背景(深い紺)
  paper: "#F2F0EA", // 主テキスト
  mute: "#8B95A7", // 補助テキスト
  prohibit: "#D5202A", // 禁止・NG
  instruct: "#2E7BE0", // 指示・OK
  hairline: "rgba(242,240,234,0.14)",
};

export const fontSize = {
  hook: 92,
  headline: 76,
  sting: 64,
  fact: 56,
  action: 84,
  stamp: 52,
};

export const maxLines: Record<keyof typeof fontSize, number> = {
  hook: 3,
  headline: 2,
  sting: 2,
  fact: 2,
  action: 2,
  stamp: 1,
};

export const safeArea = {
  top: 120,
  bottom: 260,
  right: 140,
  left: 60,
};
