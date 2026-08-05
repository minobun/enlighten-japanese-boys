import { z } from "zod";

// 標識が禁止(✕)→ 指示(✓)に切り替わるタイミングで差し替えられる値。
// 通しで同じものを使う場合は文字列1つ、差し替える場合は prohibit / instruct のペアで
// 書く(<Sign> の mode と同じ語彙)。見出し・イラストの両方で使う
const switchableSchema = z.union([
  z.string(),
  z.object({ prohibit: z.string(), instruct: z.string() }),
]);

// docs/spec.md §4.1
export const itemSchema = z.object({
  no: z.number(), // 1 | 2 | 3
  // 項目名(例: 剃った"つもり"の髭)。prohibit / instruct のペアで書くと、標識・イラストと
  // 同じフレームで「NGの言い方」→「やることの言い方」に差し替わる
  headline: switchableSchema,
  // sting / action / stamp は画面には出さず(読み上げ字幕と同じ内容になるため)、
  // 台本メモとして残せるように任意フィールドにしてある(オーナー判断)
  sting: z.string().optional(), // 刺す一言(例: その「剃ったつもり」が一番危ないのだ)
  // 相手側の事実(1〜2行)。中央に出すとイラスト・キーワードタグと情報量が競合するため任意にした
  // (オーナー判断)。省略した場合は画面に出さず、事実ブロックの尺・標識の切り替わりはそのまま
  fact: z.array(z.string()).optional(),
  action: z.string().optional(), // 今日やること
  stamp: z.string().optional(), // 締めの一言
  narration: z.array(z.string()), // TTS に読ませる文(行単位)
  // 中央に表示するitem専用イラスト(docs/spec.md 改善 / Issue #43フォローアップ)。
  // オーナーが用意するまでは未指定でよく、未指定の場合は<Illustration>側で描画を
  // スキップし、従来のテキスト表示のみになる
  illustration: switchableSchema.optional(),
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
  // 立ち絵を出すかどうか。素材の設定を消さずにオン/オフを切り替えられるようにするためのフラグで、
  // 既定は「出さない」(オーナー判断)。
  // true / false で全シーン一括、シーン名の配列で出すシーンだけを選ぶ(例: ["outro"])
  enabled: z.union([z.boolean(), z.array(z.enum(["hook", "item", "outro"]))]).default(false),
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
  outro: z.array(z.string()).optional(), // 締めの画面文言(省略時は次回予告と立ち絵だけになる)
  outroNarration: z.array(z.string()), // 締めの読み上げ文(TTS 専用)
  // まとめ(Outro)に出すイラスト。item と同じく public/illustrations/ からの相対パス。
  // Outro は標識の切り替えが無いので1枚だけ(未指定ならイラストなしで描画する)
  outroIllustration: z.string().optional(),
  nextTeaser: z.string(),
  voice: voiceSchema.optional(),
  credits: z.array(z.string()).optional(), // BGM/SE等の素材クレジット(docs/spec.md §12 / Issue #14)。あれば概要欄に追記
  bgm: bgmSchema.optional(),
  character: characterSchema.optional(),
});

export type Item = z.infer<typeof itemSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type CharacterConfig = z.infer<typeof characterSchema>;
export type SceneName = "hook" | "item" | "outro";
export type Switchable = z.infer<typeof switchableSchema>;
export type CharacterPose = z.infer<typeof characterPoseSchema>;
