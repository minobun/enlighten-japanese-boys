import { z } from "zod";

// docs/spec.md §4.1
export const itemSchema = z.object({
  no: z.number(), // 1 | 2 | 3
  headline: z.string(), // 項目名(例: 剃った"つもり"の髭)
  sting: z.string(), // 刺す一言(例: その「剃ったつもり」が一番危ないのだ)
  fact: z.array(z.string()), // 相手側の事実(1〜2行)
  action: z.string(), // 今日やること(画面で最も強調される)
  stamp: z.string(), // 締めの一言
  narration: z.array(z.string()), // TTS に読ませる文(行単位)
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
});

export type Item = z.infer<typeof itemSchema>;
export type Episode = z.infer<typeof episodeSchema>;
