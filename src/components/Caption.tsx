import { useCurrentFrame, useVideoConfig } from "remotion";
import type { LineLayout } from "../metadata";
import { color, fontFamily, fontSize, fontWeight } from "../theme";
import type { TimingChunk } from "../timing";

type CaptionProps = {
  text: string; // 表示する narration 行のテキスト
  timing?: TimingChunk[]; // その行の timing.json(docs/spec.md §7)。未生成なら undefined
  startFrame: number; // その行の音声開始フレーム(シーン起点、layout.lines[].from と同じ基準)
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// timing の塊はカタカナで元テキストと1対1対応しないため、経過した塊数(部分再生中の
// 塊は按分)÷ 総塊数の比率をそのまま元テキストの文字位置に割り当てる(docs/spec.md §7)。
const highlightRatio = (elapsedMs: number, timing: TimingChunk[]): number => {
  const progressed = timing.reduce((total, chunk) => {
    if (elapsedMs >= chunk.endMs) {
      return total + 1;
    }
    if (elapsedMs <= chunk.startMs) {
      return total;
    }
    return total + (elapsedMs - chunk.startMs) / (chunk.endMs - chunk.startMs);
  }, 0);
  return clamp(progressed / timing.length, 0, 1);
};

// 全シーン共通の位置に固定する(docs/spec.md §7)。<SafeArea> の下端(下260pxより上)に揃うよう、
// 呼び出し側の div が SafeArea の内容ボックスを 100% で満たしている前提で bottom: 0 に置く
export const Caption: React.FC<CaptionProps> = ({ text, timing, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsedMs = ((frame - startFrame) / fps) * 1000;

  const ratio = timing && timing.length > 0 ? highlightRatio(elapsedMs, timing) : 1;
  const splitIndex = Math.round(text.length * ratio);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        textAlign: "center",
        fontFamily: fontFamily.jp,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.fact,
        lineHeight: 1.4,
      }}
    >
      <span style={{ color: color.paper }}>{text.slice(0, splitIndex)}</span>
      <span style={{ color: color.mute }}>{text.slice(splitIndex)}</span>
    </div>
  );
};

// 現在フレームに対応する narration 行を lines から探す(docs/spec.md §7)。
// 見つからない(行間の隙間・範囲外)場合は -1
export const activeLineIndex = (frame: number, lines: LineLayout[]): number =>
  lines.findIndex((line) => frame >= line.from && frame < line.from + line.durationInFrames);
