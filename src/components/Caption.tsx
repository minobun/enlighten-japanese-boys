import { useCurrentFrame, useVideoConfig } from "remotion";
import type { LineLayout } from "../metadata";
import { color, fontFamily, fontSize, fontWeight } from "../theme";
import type { TimingChunk } from "../timing";

// 字幕を主役として全シーン共通の位置・最大幅に固定する(docs/spec.md 改善 / Issue #41)。
// 画面いっぱいに広げず中央へ寄せることで、キャラクター表示領域(左下)と重なりにくくする
const CAPTION_MAX_WIDTH_PX = 860;

type CaptionProps = {
  text: string; // 表示する narration 行のテキスト
  timing?: TimingChunk[]; // その行の timing.json(docs/spec.md §7)。未生成なら undefined
  startFrame: number; // その行の音声開始フレーム(シーン起点、layout.lines[].from と同じ基準)
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// timing の塊はカタカナで元テキストと1対1対応しないため、塊の読み(モーラ数 = カタカナの
// 文字数)を重みにして元テキストの文字位置へ割り当てる(docs/spec.md §7)。
// 塊数で等分すると、長い塊と短い塊が同じ幅として扱われてハイライトが読み上げからズレる。
const highlightRatio = (elapsedMs: number, timing: TimingChunk[]): number => {
  const weight = (chunk: TimingChunk): number => Math.max(1, chunk.text.length);
  const total = timing.reduce((sum, chunk) => sum + weight(chunk), 0);

  const progressed = timing.reduce((sum, chunk) => {
    if (elapsedMs >= chunk.endMs) {
      return sum + weight(chunk);
    }
    if (elapsedMs <= chunk.startMs) {
      return sum;
    }
    const within = (elapsedMs - chunk.startMs) / (chunk.endMs - chunk.startMs);
    return sum + weight(chunk) * within;
  }, 0);

  return clamp(progressed / total, 0, 1);
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
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: CAPTION_MAX_WIDTH_PX,
        maxWidth: "100%",
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
