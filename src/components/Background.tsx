import { interpolate, useCurrentFrame } from "remotion";
import type { SignMode } from "./Sign";
import { color } from "../theme";

// <Sign> と同じ mode/switchAt を受け取り、NG→改善の切り替えに合わせて背景の
// アクセントも赤→青へクロスフェードする(docs/spec.md 改善 / Issue #43)。
// 常時は動かさず、切り替えの瞬間だけに動きを集中させる(docs/spec.md §5.4 の精神を背景にも適用)
const SWITCH_TRANSITION_FRAMES = 30;

const PARTICLE_COUNT = 26;
// 粒子が画面を1周する周期(フレーム数)。速度差はparticleごとのspeedFactorで付ける
const PARTICLE_LOOP_PCT = 120; // -10%〜110%を移動範囲にし、画面端で唐突に消えないようにする

type Particle = {
  xPct: number;
  phase: number;
  sizePx: number;
  speedFactor: number;
};

// Math.random()は使わない(Remotionは同じフレームを複数ワーカーで並行レンダーするため、
// 呼び出しごとに値が変わる非決定的な処理は使えない)。指数の異なる乗数で疑似乱数っぽく散らす
const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  xPct: (i * 37) % 100,
  phase: (i * 53) % PARTICLE_LOOP_PCT,
  sizePx: 2 + (i % 3),
  speedFactor: 0.12 + (i % 4) * 0.04,
}));

const glow = (glowColor: string, position: string): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  background: `radial-gradient(circle at ${position}, ${glowColor} 0%, transparent 62%)`,
});

// direction: prohibitは上へ立ち上る火の粉のように、instructは下へ静かに降りる粒子にする。
// 色相だけでなく動きの向きも変えることで、NG/改善の切り替えを背景からも感じられるようにする
const particleTopPct = (p: Particle, frame: number, direction: 1 | -1): number => {
  const raw = p.phase + frame * p.speedFactor * direction;
  return (((raw % PARTICLE_LOOP_PCT) + PARTICLE_LOOP_PCT) % PARTICLE_LOOP_PCT) - 10;
};

const ParticleLayer: React.FC<{ direction: 1 | -1; particleColor: string; opacity: number }> = ({
  direction,
  particleColor,
  opacity,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.xPct}%`,
            top: `${particleTopPct(p, frame, direction)}%`,
            width: p.sizePx,
            height: p.sizePx,
            borderRadius: "50%",
            background: particleColor,
          }}
        />
      ))}
    </div>
  );
};

type BackgroundProps = {
  // 初期モード。switchAt 未指定ならこのモードのアクセントを維持し続ける
  mode: SignMode;
  // このフレームで反対のモードへクロスフェードする(<Sign> の switchAt と同じ値を渡す想定)
  switchAt?: number;
};

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
      <ParticleLayer
        direction={-1}
        particleColor={color.prohibitParticle}
        opacity={prohibitOpacity}
      />
      <ParticleLayer direction={1} particleColor={color.instructParticle} opacity={instructOpacity} />
    </div>
  );
};
