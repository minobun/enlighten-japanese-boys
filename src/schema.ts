import { z } from "zod";

// docs/spec.md §4.1
export const itemSchema = z.object({
  no: z.number(), // 1 | 2 | 3
  headline: z.string(), // 項目名(例: 剃った"つもり"の髭)
  sting: z.string(), // 刺す一言(例: その「剃ったつもり」が一番危ないのだ)
  // 相手側の事実(1〜2行)。中央に出すとイラスト・キーワードタグと情報量が競合するため任意にした
  // (オーナー判断)。省略した場合は画面に出さず、事実ブロックの尺・標識の切り替わりはそのまま
  fact: z.array(z.string()).optional(),
  action: z.string(), // 今日やること(画面で最も強調される)
  stamp: z.string(), // 締めの一言
  narration: z.array(z.string()), // TTS に読ませる文(行単位)
  // 中央に表示するitem専用イラスト(docs/spec.md 改善 / Issue #43フォローアップ)。
  // public/illustrations/ からの相対パス。オーナーが用意するまでは未指定でよく、
  // 未指定の場合は<Illustration>側で描画をスキップし、従来のテキスト表示のみになる
  illustration: z.string().optional(),
});

// docs/spec.md §6.3。VOICEVOX パラメータをエピソード単位で上書きするための任意フィールド
export const voiceSchema = z
  .object({
    speedScale: z.number(),
    pitchScale: z.number(),
    intonationScale: z.number(),
    volumeScale: z.number(),
    prePhonemeLength: z.number(),
    postPhonemeLength: z.number(),
  })
  .partial();

export const defaultVoice = {
  speedScale: 1.15,
  pitchScale: 0.0,
  intonationScale: 1.1,
  volumeScale: 1.0,
  prePhonemeLength: 0.1,
  postPhonemeLength: 0.2,
};

// BGM 設定(docs/spec.md §13 / Issue #16)。音源ファイルはオーナーが public/bgm/ に配置する
export const bgmSchema = z.object({
  file: z.string(), // 例: "main.mp3"(public/bgm/ からの相対パス)
  volume: z.number().default(0.1), // ナレーションを邪魔しない音量
});

// 口パク用の口レイヤー。坂本アヒル氏の PSD 立ち絵から、体(body)と同じキャンバスサイズで
// 口レイヤーだけを PNG 書き出ししたものを想定する(同サイズなので重ねるだけで位置が合う)
const characterMouthSchema = z.object({
  closed: z.string(), // 口を閉じた口レイヤー
  open: z.string(), // 口を開いた口レイヤー
});

// 立ち絵の表情1つ分。口パクさせない(1枚しか無い)場合は文字列、口パクさせる場合は
// 口だけを抜いた body と口レイヤーのペアで書く(坂本アヒル式・docs/spec.md §13 / Issue #18)。
// ファイル名はすべて public/character/ からの相対パス
const characterPoseSchema = z.union([
  z.string(),
  z.object({ body: z.string(), mouth: characterMouthSchema.optional() }),
]);

// 立ち絵設定(docs/spec.md §13 / Issue #18)。画像はオーナーが public/character/ に配置する。
// troubled / angry は任意で、揃っていない場合は Character コンポーネント側でフォールバックする
export const characterSchema = z.object({
  normal: characterPoseSchema,
  troubled: characterPoseSchema.optional(),
  angry: characterPoseSchema.optional(),
  scale: z.number().default(1),
});

export const episodeSchema = z.object({
  id: z.string(), // "ep01"
  part: z.number(), // 1
  category: z.string(), // "見た目編"
  hook: z.array(z.string()), // フックの画面文言
  hookNarration: z.array(z.string()), // フックの読み上げ文(TTS 専用。docs/spec.md §6.4)
  items: z.array(itemSchema).length(3),
  outro: z.array(z.string()), // 締めの画面文言
  outroNarration: z.array(z.string()), // 締めの読み上げ文(TTS 専用)
  nextTeaser: z.string(),
  voice: voiceSchema.optional(),
  credits: z.array(z.string()).optional(), // BGM/SE等の素材クレジット(docs/spec.md §12 / Issue #14)。あれば概要欄に追記
  bgm: bgmSchema.optional(),
  character: characterSchema.optional(),
});

export type Item = z.infer<typeof itemSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type CharacterConfig = z.infer<typeof characterSchema>;
export type CharacterPose = z.infer<typeof characterPoseSchema>;
