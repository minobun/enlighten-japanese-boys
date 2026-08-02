// デザイントークン。色・フォントサイズ・行数上限・セーフエリアはこのファイルに集約する(docs/spec.md §5.1, §5.2, §3)。
// このファイル以外に色コードを直書きすることを禁止する。

import { loadFont as loadNotoSansJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadRobotoMono } from "@remotion/google-fonts/RobotoMono";

export const color = {
  ground: "#0E1524", // 背景(深い紺)
  paper: "#F2F0EA", // 主テキスト
  mute: "#8B95A7", // 補助テキスト
  prohibit: "#D5202A", // 禁止・NG
  instruct: "#2E7BE0", // 指示・OK
  hairline: "rgba(242,240,234,0.14)",
  // 背景の装飾用。文字のコントラストを保つため低不透明度に固定する(docs/spec.md 改善 / Issue #43)
  prohibitGlow: "rgba(213,32,42,0.22)",
  instructGlow: "rgba(46,123,224,0.22)",
  dot: "rgba(242,240,234,0.05)",
};

export const fontSize = {
  hook: 92,
  headline: 76,
  sting: 64,
  fact: 56,
  action: 84,
  stamp: 52,
  keyword: 40, // 中央のキーワードタグ専用(docs/spec.md 改善 / Issue #41)。読み上げ字幕を主役にするため、事実・締めは小さいタグ表示にする
  keywordEmphasis: 56, // actionタグ専用。他のタグより大きくして「最も強調する」役割は保つ(docs/spec.md §4.2 / Issue #41)
  thumbnailTitle: 116, // サムネイル専用: 「恋愛NG集 3選」(docs/spec.md §13 / Issue #15)
  thumbnailSubtitle: 68, // サムネイル専用: 「{category} PART{part}」
};

export const maxLines: Record<keyof typeof fontSize, number> = {
  hook: 3,
  headline: 2,
  sting: 2,
  fact: 2,
  action: 2,
  stamp: 1,
  keyword: 1,
  keywordEmphasis: 1,
  thumbnailTitle: 1,
  thumbnailSubtitle: 1,
};

export const safeArea = {
  top: 120,
  bottom: 260,
  right: 140,
  left: 60,
};

// 立ち絵の基準サイズ・配置(docs/spec.md §13 / Issue #18, #42)。
// character.scale(episode単位)はこの基準高さへの倍率
export const character = {
  baseHeightPx: 400,
  // 右下配置(オーナー確認により左から右へ変更)。右は <SafeArea> の padding で既に
  // 確保済み。下は 260px セーフエリアの内側かつ <Caption> の字幕テキストと重ならない余白を確保する
  bottomOffsetPx: 190,
};

// SE(効果音)のデフォルト音量(docs/spec.md §13 / Issue #17)。ナレーションを邪魔しない程度
export const seVolume = 0.3;

// docs/spec.md §5.2: @remotion/google-fonts から読み込む。
// weight は用途ごとに typography 側で使い分けるため、ここでは family 名だけを保持する。
const { fontFamily: notoSansJPFamily } = loadNotoSansJP("normal", {
  weights: ["700", "900"],
  subsets: ["japanese"],
  // 日本語は unicode-range 単位で大量のチャンクに分割されるため、想定内の警告を抑制する
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: robotoMonoFamily } = loadRobotoMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export const fontFamily = {
  jp: notoSansJPFamily,
  mono: robotoMonoFamily,
};

export const fontWeight = {
  black: 900,
  bold: 700,
  medium: 500,
} as const;

// 役割ごとの書体定義(docs/spec.md §5.2)。
// 「見出し / action」= Black、「本文 / fact」= Bold と明記されているのを踏まえ、
// 画面上で最も強く目立たせる役割(hook / headline / action)を Black、
// それ以外(sting / fact / stamp)を Bold として割り当てる。
export const typography: Record<
  keyof typeof fontSize,
  { fontSize: number; fontFamily: string; fontWeight: number }
> = {
  hook: { fontSize: fontSize.hook, fontFamily: fontFamily.jp, fontWeight: fontWeight.black },
  headline: {
    fontSize: fontSize.headline,
    fontFamily: fontFamily.jp,
    fontWeight: fontWeight.black,
  },
  sting: { fontSize: fontSize.sting, fontFamily: fontFamily.jp, fontWeight: fontWeight.bold },
  fact: { fontSize: fontSize.fact, fontFamily: fontFamily.jp, fontWeight: fontWeight.bold },
  action: { fontSize: fontSize.action, fontFamily: fontFamily.jp, fontWeight: fontWeight.black },
  stamp: { fontSize: fontSize.stamp, fontFamily: fontFamily.jp, fontWeight: fontWeight.bold },
  keyword: { fontSize: fontSize.keyword, fontFamily: fontFamily.jp, fontWeight: fontWeight.bold },
  keywordEmphasis: {
    fontSize: fontSize.keywordEmphasis,
    fontFamily: fontFamily.jp,
    fontWeight: fontWeight.black,
  },
  thumbnailTitle: {
    fontSize: fontSize.thumbnailTitle,
    fontFamily: fontFamily.jp,
    fontWeight: fontWeight.black,
  },
  thumbnailSubtitle: {
    fontSize: fontSize.thumbnailSubtitle,
    fontFamily: fontFamily.jp,
    fontWeight: fontWeight.black,
  },
};

// 番号・ラベル等、英数字表示に使う書体(docs/spec.md §5.2)
export const label = {
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.medium,
};
