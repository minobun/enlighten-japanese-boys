// 尺の自動算出(docs/spec.md §8)。フレーム数はどこにもハードコードせず、
// narration の wav 実長 + 秒指定のパディングから全シーン・全ブロックの位置を決める。
// ここで算出した EpisodeLayout を props としてシーンに配り、<Sequence> に流す。

import { getAudioDurationInSeconds } from "@remotion/media-utils";
import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";
import { narrationKey, narrationLines } from "./narration";
import type { Episode, Item } from "./schema";

// docs/spec.md §3。fps は動画スペックの定数で、シーンの尺とは無関係(Root.tsx と共有する)
export const FPS = 30;

// docs/spec.md §8 のパディング。秒で持ち、フレームへの変換は fps 経由で行う
const SCENE_PADDING_SEC = 0.3; // シーン間
const LINE_PADDING_SEC = 0.15; // 行間

// wav が無い行のフォールバック(Studio で音声未生成でも通しで見られるようにする)
const FALLBACK_LINE_SEC = 2;

// narration 行が1つも割り当たらないブロック(= 行数がブロック数に足りない場合)の無音尺
const SILENT_BLOCK_SEC = 0.8;

// docs/spec.md §3 の目安。外れたら警告する(尺そのものは音声に従わせる)
const TARGET_MIN_SEC = 40;
const TARGET_MAX_SEC = 50;

// docs/spec.md §4.2: Item の内部構造。順序がそのまま画面の進行になる
export const ITEM_BLOCKS = ["declare", "fact", "action", "stamp"] as const;
export type ItemBlockName = (typeof ITEM_BLOCKS)[number];

// narration 行数がブロック数で割り切れないときに、余りを受け取るブロックの優先順。
// action を「最も長く表示」する(docs/spec.md §4.2)ため action を先頭に置く
const EXTRA_LINE_PRIORITY: ItemBlockName[] = ["action", "fact", "declare", "stamp"];

// from はいずれも「親 <Sequence> からの相対フレーム」。
// SceneLayout.from だけが動画先頭からの絶対フレームで、その中の lines / blocks はシーン先頭起点。
export type LineLayout = {
  key: string;
  from: number;
  durationInFrames: number; // 音声長 + 行間パディング(字幕はこの間ずっと出したままにする)
};

export type BlockLayout = {
  from: number;
  durationInFrames: number;
};

export type SceneLayout = {
  from: number;
  durationInFrames: number;
  lines: LineLayout[];
};

export type ItemLayout = SceneLayout & {
  blocks: Record<ItemBlockName, BlockLayout>;
};

export type EpisodeLayout = {
  hook: SceneLayout;
  items: ItemLayout[];
  outro: SceneLayout;
  durationInFrames: number;
};

// 音声長(秒)を key から引くための関数型。wav が読めない行は呼び出し側でフォールバックを返す
export type LineDurationSec = (key: string) => number;

const toFrames = (seconds: number, fps: number): number => Math.max(1, Math.ceil(seconds * fps));

const sumFrames = (slots: LineLayout[]): number =>
  slots.reduce((total, slot) => total + slot.durationInFrames, 0);

// シーン内の1行が占める尺 = 音声長 + 行間パディング。
// from は呼び出し側で詰め直すため、ここでは 0 起点で並べる
const buildLines = (
  keyPrefix: string,
  texts: string[],
  durationSec: LineDurationSec,
  fps: number,
): LineLayout[] => {
  let cursor = 0;
  return texts.map((_, index) => {
    const key = narrationKey(keyPrefix, index);
    const durationInFrames = toFrames(durationSec(key) + LINE_PADDING_SEC, fps);
    const line = { key, from: cursor, durationInFrames };
    cursor += durationInFrames;
    return line;
  });
};

const shiftLines = (lines: LineLayout[], offset: number): LineLayout[] =>
  lines.map((line) => ({ ...line, from: line.from + offset }));

// 行をブロックへ順番に配る。1ブロックあたり base 行、余りは EXTRA_LINE_PRIORITY 順に1行ずつ
const distribute = (lineCount: number): Record<ItemBlockName, number> => {
  const base = Math.floor(lineCount / ITEM_BLOCKS.length);
  const counts = Object.fromEntries(ITEM_BLOCKS.map((name) => [name, base])) as Record<
    ItemBlockName,
    number
  >;
  let remainder = lineCount % ITEM_BLOCKS.length;
  for (const name of EXTRA_LINE_PRIORITY) {
    if (remainder === 0) {
      break;
    }
    counts[name] += 1;
    remainder -= 1;
  }
  return counts;
};

// Hook / Outro は画面ブロックが1つなので、行を並べてシーン間パディングを足すだけ
const buildSimpleScene = (
  from: number,
  keyPrefix: string,
  texts: string[],
  durationSec: LineDurationSec,
  fps: number,
): SceneLayout => {
  const lines = buildLines(keyPrefix, texts, durationSec, fps);
  const spoken = sumFrames(lines) || toFrames(SILENT_BLOCK_SEC, fps);
  return {
    from,
    durationInFrames: spoken + toFrames(SCENE_PADDING_SEC, fps),
    lines,
  };
};

// Item は宣告 → 事実 → 行動 → スタンプの4ブロック。各ブロックの尺は、そこに割り当たった
// narration 行の合計。シーン間パディングは最後のブロックに含め、シーン末尾に無表示の隙間を作らない
const buildItemScene = (
  from: number,
  item: Item,
  durationSec: LineDurationSec,
  fps: number,
): ItemLayout => {
  const slots = buildLines(`item${item.no}`, item.narration, durationSec, fps);
  const counts = distribute(slots.length);
  const silentFrames = toFrames(SILENT_BLOCK_SEC, fps);
  const scenePaddingFrames = toFrames(SCENE_PADDING_SEC, fps);

  const blocks = {} as Record<ItemBlockName, BlockLayout>;
  const lines: LineLayout[] = [];
  let cursor = 0;
  let taken = 0;

  ITEM_BLOCKS.forEach((name, index) => {
    const own = slots.slice(taken, taken + counts[name]);
    taken += counts[name];
    const isLast = index === ITEM_BLOCKS.length - 1;
    const spoken = sumFrames(own) || silentFrames;

    blocks[name] = {
      from: cursor,
      durationInFrames: spoken + (isLast ? scenePaddingFrames : 0),
    };
    // buildLines は無音ブロックを知らないので、行の from をブロックの実際の位置に合わせ直す
    lines.push(...shiftLines(own, cursor - (own[0]?.from ?? 0)));
    cursor += blocks[name].durationInFrames;
  });

  return { from, durationInFrames: cursor, lines, blocks };
};

// エピソード全体のレイアウト。シーンは隙間なく連続し、総尺 = 各シーンの合計
export const buildLayout = (
  episode: Episode,
  durationSec: LineDurationSec,
  fps: number,
): EpisodeLayout => {
  const hook = buildSimpleScene(0, "hook", episode.hookNarration, durationSec, fps);

  let cursor = hook.from + hook.durationInFrames;
  const items = episode.items.map((item) => {
    const layout = buildItemScene(cursor, item, durationSec, fps);
    cursor += layout.durationInFrames;
    return layout;
  });

  const outro = buildSimpleScene(cursor, "outro", episode.outroNarration, durationSec, fps);
  cursor += outro.durationInFrames;

  return { hook, items, outro, durationInFrames: cursor };
};

// 音声がまだ無い状態(Studio でのプレビュー / calculateMetadata 前の初回描画)でも
// 通しで見られるようにするためのレイアウト。全行を FALLBACK_LINE_SEC として扱う
export const fallbackLayout = (episode: Episode, fps: number): EpisodeLayout =>
  buildLayout(episode, () => FALLBACK_LINE_SEC, fps);

// public/audio/{id}/{key}.wav の実長を引く。未生成の行はフォールバック秒に落として
// レンダリング前でもレイアウトが壊れないようにする
const measureNarration = async (episode: Episode): Promise<Map<string, number>> => {
  const lines = narrationLines(episode);
  const missing: string[] = [];

  const measured = await Promise.all(
    lines.map(async ({ key }) => {
      try {
        const seconds = await getAudioDurationInSeconds(
          staticFile(`audio/${episode.id}/${key}.wav`),
        );
        return [key, seconds] as const;
      } catch {
        missing.push(key);
        return [key, FALLBACK_LINE_SEC] as const;
      }
    }),
  );

  if (missing.length > 0) {
    console.warn(
      `音声が読めない行が ${missing.length} 件あるのだ(${missing.join(", ")})。\n` +
        `${FALLBACK_LINE_SEC}秒/行 として尺を仮置きするのだ。\`pnpm synthesize ${episode.id}\` を実行するのだ`,
    );
  }

  return new Map(measured);
};

const warnIfOffTarget = (durationInFrames: number, fps: number): void => {
  const seconds = durationInFrames / fps;
  if (seconds < TARGET_MIN_SEC || seconds > TARGET_MAX_SEC) {
    console.warn(
      `総尺が ${seconds.toFixed(1)}秒なのだ。目安の ${TARGET_MIN_SEC}〜${TARGET_MAX_SEC}秒` +
        `(docs/spec.md §3)から外れているのだ。narration の文量を調整するのだ`,
    );
  }
};

type Props = Episode & {
  debugSafeArea: boolean;
  layout?: EpisodeLayout;
};

// docs/spec.md §8: 尺は音声長から自動算出する。フレーム数のハードコードはしない
export const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const durations = await measureNarration(props);
  const layout = buildLayout(props, (key) => durations.get(key) ?? FALLBACK_LINE_SEC, FPS);

  warnIfOffTarget(layout.durationInFrames, FPS);

  return {
    durationInFrames: layout.durationInFrames,
    props: { ...props, layout },
  };
};
