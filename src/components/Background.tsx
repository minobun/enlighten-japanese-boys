import { interpolate, useCurrentFrame } from "remotion";
import type { SignMode } from "./Sign";
import { color } from "../theme";

// <Sign> と同じ mode/switchAt を受け取り、NG→改善の切り替えに合わせて背景の
// アクセントも赤→青へクロスフェードする(docs/spec.md 改善 / Issue #43)。
// 常時は動かさず、切り替えの瞬間だけに動きを集中させる(docs/spec.md §5.4 の精神を背景にも適用)
const SWITCH_TRANSITION_FRAMES = 30;

// ドット柄は常に固定表示。単色べた塗りに見えないようにする低コントラストの装飾
const DOT_SIZE_PX = 36;

type BackgroundProps = {
  // 初期モード。switchAt 未指定ならこのモードのアクセントを維持し続ける
  mode: SignMode;
  // このフレームで反対のモードへクロスフェードする(<Sign> の switchAt と同じ値を渡す想定)
  switchAt?: number;
};

const glow = (glowColor: string, position: string): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  background: `radial-gradient(circle at ${position}, ${glowColor} 0%, transparent 62%)`,
});

// 全シーン共通の背景装飾。Hook/Item/Outroの各シーンの最背面に置くだけで、
// エピソード別・シーン別の分岐を作らずに済む(docs/spec.md §14)
export const Background: React.FC<BackgroundProps> = ({ mode, switchAt }) => {
  const frame = useCurrentFrame();

  const switchProgress =
    switchAt === undefined
      ? 0
      : interpolate(frame, [switchAt, switchAt + SWITCH_TRANSITION_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const prohibitOpacity = mode === "prohibit" ? 1 - switchProgress : switchProgress;
  const instructOpacity = 1 - prohibitOpacity;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ ...glow(color.prohibitGlow, "18% 12%"), opacity: prohibitOpacity }} />
      <div style={{ ...glow(color.instructGlow, "85% 82%"), opacity: instructOpacity }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${color.dot} 2px, transparent 2px)`,
          backgroundSize: `${DOT_SIZE_PX}px ${DOT_SIZE_PX}px`,
        }}
      />
    </div>
  );
};
