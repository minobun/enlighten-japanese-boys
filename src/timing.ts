// VOICEVOX AudioQuery のモーラ長から字幕タイムスタンプを確定値で算出する(docs/spec.md §7)。
// Whisper は使わない。scripts/timing.ts(生成)と <Caption>(表示)双方から使う純粋関数。

export type Mora = {
  text: string;
  consonant: string | null;
  consonant_length: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
};

export type AccentPhrase = {
  moras: Mora[];
  accent: number;
  pause_mora: Mora | null;
  is_interrogative: boolean;
};

export type AudioQuery = {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  pauseLength?: number | null;
  pauseLengthScale?: number;
};

// 字幕1塊。塊同士は隙間なく連続し、全体で [0, 音声長] を覆う
export type TimingChunk = {
  text: string; // moras[].text の連結(カタカナ)。元 narration の表記とは対応しない(Issue #10)
  startMs: number;
  endMs: number;
};

export type ChunkMode = "punctuation" | "mora";

// 塊がこのモーラ数未満なら隣の塊と結合する(§7「モーラ単位では細かすぎる」)
const MIN_MORAS_PER_CHUNK = 3;

// 疑問形(is_interrogative)の accent_phrase には、VOICEVOX ENGINE が合成時に
// 語尾を上げるモーラ(vowel_length 0.15s)を自動で足す。query.json には現れないが
// 実際の wav には含まれるため、ここで同じ補正を入れないと最大 150ms ずれる。
// 条件は ENGINE の apply_interrogative_upspeak と同じ(末尾モーラの pitch > 0)。
const UPSPEAK_VOWEL_LENGTH = 0.15;
const VOWEL_TO_KANA: Record<string, string> = { a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ" };

const upspeakMora = (phrase: AccentPhrase): Mora | null => {
  const last = phrase.moras[phrase.moras.length - 1];
  if (!phrase.is_interrogative || !last || last.pitch <= 0) {
    return null;
  }
  const kana = VOWEL_TO_KANA[last.vowel.toLowerCase()];
  if (!kana) {
    return null;
  }
  return {
    text: kana,
    consonant: null,
    consonant_length: null,
    vowel: last.vowel,
    vowel_length: UPSPEAK_VOWEL_LENGTH,
    pitch: last.pitch,
  };
};

// pause_mora の長さは pauseLength(指定があれば上書き)× pauseLengthScale で決まる
const pauseSeconds = (pause: Mora, query: AudioQuery): number => {
  const base = query.pauseLength ?? pause.vowel_length;
  return base * (query.pauseLengthScale ?? 1);
};

const moraSeconds = (mora: Mora): number => (mora.consonant_length ?? 0) + mora.vowel_length;

type Unit = {
  mora: Mora;
  isPause: boolean;
  endsPhrase: boolean; // この単位で accent_phrase が終わる(= 塊の切れ目候補)
};

const flatten = (query: AudioQuery): Unit[] => {
  const units: Unit[] = [];
  for (const phrase of query.accent_phrases) {
    const moras = [...phrase.moras];
    const upspeak = upspeakMora(phrase);
    if (upspeak) {
      moras.push(upspeak);
    }
    moras.forEach((mora, i) => {
      units.push({ mora, isPause: false, endsPhrase: i === moras.length - 1 && !phrase.pause_mora });
    });
    if (phrase.pause_mora) {
      units.push({ mora: phrase.pause_mora, isPause: true, endsPhrase: true });
    }
  }
  return units;
};

type RawChunk = {
  text: string;
  moraCount: number;
  endsWithPause: boolean;
  startSec: number;
  endSec: number;
};

// speedScale は prePhonemeLength / postPhonemeLength も含めた全体に掛かる(ENGINE の実装に合わせる)
const toRawChunks = (query: AudioQuery, mode: ChunkMode): RawChunk[] => {
  const speed = query.speedScale;
  const chunks: RawChunk[] = [];
  let cursor = query.prePhonemeLength / speed;
  let current: RawChunk | null = null;

  for (const unit of flatten(query)) {
    const seconds = (unit.isPause ? pauseSeconds(unit.mora, query) : moraSeconds(unit.mora)) / speed;
    // 直前の塊がすでに閉じている状態のポーズ(mora モードの句読点)は、その塊の末尾に足す
    if (!current && unit.isPause && chunks.length > 0) {
      cursor += seconds;
      chunks[chunks.length - 1].endSec = cursor;
      chunks[chunks.length - 1].endsWithPause = true;
      continue;
    }
    if (!current) {
      current = { text: "", moraCount: 0, endsWithPause: false, startSec: cursor, endSec: cursor };
    }
    if (!unit.isPause) {
      current.text += unit.mora.text;
      current.moraCount += 1;
    }
    cursor += seconds;
    // 塊は隙間なく連続させる。ポーズは直前の塊に含める(字幕は句読点の間も表示したままにする)
    current.endSec = cursor;
    current.endsWithPause = unit.isPause;

    const boundary = mode === "mora" ? !unit.isPause : unit.endsPhrase;
    if (boundary) {
      chunks.push(current);
      current = null;
    }
  }

  if (current) {
    chunks.push(current);
  }
  // 先頭・末尾の無音(pre / postPhonemeLength)も両端の塊に含め、塊全体で [0, 音声長] を覆う
  if (chunks.length > 0) {
    chunks[0].startSec = 0;
    chunks[chunks.length - 1].endSec += query.postPhonemeLength / speed;
  }
  return chunks;
};

const mergeInto = (target: RawChunk, source: RawChunk): RawChunk => ({
  text: target.text + source.text,
  moraCount: target.moraCount + source.moraCount,
  endsWithPause: source.endsWithPause,
  startSec: target.startSec,
  endSec: source.endSec,
});

// 短すぎる塊を隣と結合する。句読点(ポーズ)で終わる塊は句読点をまたいで前に伸ばさず、
// 直前の塊に後ろ向きに結合する(「〜なのだ、」のような短い文末を自然に扱うため)
const mergeShortChunks = (chunks: RawChunk[]): RawChunk[] => {
  const merged: RawChunk[] = [];
  let pending: RawChunk | null = null;

  for (const chunk of chunks) {
    const current: RawChunk = pending ? mergeInto(pending, chunk) : chunk;
    pending = null;
    if (current.moraCount >= MIN_MORAS_PER_CHUNK) {
      merged.push(current);
      continue;
    }
    if (current.endsWithPause && merged.length > 0) {
      merged[merged.length - 1] = mergeInto(merged[merged.length - 1], current);
      continue;
    }
    pending = current; // 次の塊と前向きに結合する
  }

  if (pending) {
    if (merged.length > 0) {
      merged[merged.length - 1] = mergeInto(merged[merged.length - 1], pending);
    } else {
      merged.push(pending);
    }
  }
  return merged;
};

const toMs = (seconds: number): number => Math.round(seconds * 1000);

export const buildTiming = (query: AudioQuery, mode: ChunkMode = "punctuation"): TimingChunk[] => {
  const raw = toRawChunks(query, mode);
  const chunks = mode === "punctuation" ? mergeShortChunks(raw) : raw;
  return chunks.map((chunk) => ({
    text: chunk.text,
    startMs: toMs(chunk.startSec),
    endMs: toMs(chunk.endSec),
  }));
};

// 音声全体の長さ(秒)。timing の最後の塊の endMs と一致する
export const queryDurationSec = (query: AudioQuery): number => {
  const speed = query.speedScale;
  let total = query.prePhonemeLength + query.postPhonemeLength;
  for (const unit of flatten(query)) {
    total += unit.isPause ? pauseSeconds(unit.mora, query) : moraSeconds(unit.mora);
  }
  return total / speed;
};
