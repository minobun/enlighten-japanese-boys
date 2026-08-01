import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { color } from "../theme";

// docs/spec.md §5.3: 禁止標識(赤リング+斜線)から指示標識(青丸+チェック)へ切り替わる、
// シリーズの識別記号。凝ってよいのはこのコンポーネントだけで、他のテキストは <FadeIn> に統一する
// (docs/spec.md §5.4 の「6フレーム以内」の例外もここだけ)。
//
// 形状はすべて中心を原点とする viewBox (-200..200) 上で定義する。半径 150 / stroke 26 は spec 指定値。
const RADIUS = 150;
const STROKE_WIDTH = 26;
// リングの外周。斜線の長さと、指示標識の青丸の半径をここに揃えて 2モードの外形を一致させる
const OUTER_RADIUS = RADIUS + STROKE_WIDTH / 2;
const VIEW_BOX_HALF = 200;

// チェックマーク。pathLength=1 で長さを正規化しているので strokeDashoffset を 1→0 に動かすと一筆書きになる
const CHECK_PATH = "M -78 6 L -18 68 L 86 -64";
const CHECK_STROKE_WIDTH = 34;

// 登場と切り替えだけ overshoot させ、線を引く動き(斜線・チェック)は damping を大きくして行き過ぎを殺す。
// 斜線が 1 を超えるとリングの外にはみ出すため、こちらは overshoot させてはいけない。
// 尺は durationInFrames で明示する。切り替えは画面の主役なので、回転が読み取れる長さを確保する。
const APPEAR_CONFIG = { damping: 12, mass: 0.7 };
const APPEAR_DURATION_IN_FRAMES = 16;
const SWITCH_CONFIG = { damping: 13, mass: 0.9 };
const SWITCH_DURATION_IN_FRAMES = 26;
const DRAW_CONFIG = { damping: 200 };
const DRAW_DURATION_IN_FRAMES = 14;

// 線を引き始めるまでの間。登場時はリングが出た直後、切り替え時は回転が終わりかけて
// 新しい円が読める頃(切り替えの中盤)から引き始める
const APPEAR_DRAW_DELAY_IN_FRAMES = 4;
const SWITCH_DRAW_DELAY_IN_FRAMES = 10;

const DEFAULT_SIZE = 340;

export type SignMode = "prohibit" | "instruct";

type SignProps = {
  // 初期モード
  mode: SignMode;
  // このフレームでもう一方のモードへ切り替える。未指定なら mode 単独の登場アニメーションのみ
  switchAt?: number;
  // 登場アニメーションの開始フレーム(シーン内の相対フレーム)
  appearAt?: number;
  // 描画サイズ(px 正方)
  size?: number;
};

// 切り替えの前後で各レイヤーがどう振る舞うか。抜ける側(from)は回りながら縮んで消え、
// 立ち上がる側(to)は逆向きに回り込んできて原点に収まる。
type Layer = {
  opacity: number;
  rotate: number;
  scale: number;
  // そのレイヤーが線(斜線 / チェック)を引き始めるフレーム
  drawFrom: number;
};

export const Sign: React.FC<SignProps> = ({
  mode,
  switchAt,
  appearAt = 0,
  size = DEFAULT_SIZE,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: frame - appearAt,
    fps,
    config: APPEAR_CONFIG,
    durationInFrames: APPEAR_DURATION_IN_FRAMES,
  });
  const appearOpacity = interpolate(appear, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appearScale = interpolate(appear, [0, 1], [0.72, 1]);

  // switchAt 未指定時は 0 に固定する。このとき from は不変(opacity 1)、to は非表示のままになる
  const switchProgress =
    switchAt === undefined
      ? 0
      : spring({
          frame: frame - switchAt,
          fps,
          config: SWITCH_CONFIG,
          durationInFrames: SWITCH_DURATION_IN_FRAMES,
        });

  const from: Layer = {
    opacity: interpolate(switchProgress, [0.1, 0.55], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    rotate: interpolate(switchProgress, [0, 1], [0, -110]),
    scale: interpolate(switchProgress, [0, 1], [1, 0.55]),
    drawFrom: appearAt + APPEAR_DRAW_DELAY_IN_FRAMES,
  };
  const to: Layer = {
    opacity: interpolate(switchProgress, [0.45, 0.85], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    rotate: interpolate(switchProgress, [0, 1], [100, 0]),
    scale: interpolate(switchProgress, [0, 1], [0.55, 1]),
    drawFrom:
      switchAt === undefined
        ? appearAt + APPEAR_DRAW_DELAY_IN_FRAMES
        : switchAt + SWITCH_DRAW_DELAY_IN_FRAMES,
  };

  const prohibit = mode === "prohibit" ? from : to;
  const instruct = mode === "prohibit" ? to : from;

  // 斜線は scaleX 0→1、チェックは strokeDashoffset 1→0 で描く(docs/spec.md §5.3)
  const slashScale = spring({
    frame: frame - prohibit.drawFrom,
    fps,
    config: DRAW_CONFIG,
    durationInFrames: DRAW_DURATION_IN_FRAMES,
  });
  const checkProgress = spring({
    frame: frame - instruct.drawFrom,
    fps,
    config: DRAW_CONFIG,
    durationInFrames: DRAW_DURATION_IN_FRAMES,
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-VIEW_BOX_HALF} ${-VIEW_BOX_HALF} ${VIEW_BOX_HALF * 2} ${VIEW_BOX_HALF * 2}`}
      style={{
        opacity: appearOpacity,
        transform: `scale(${appearScale})`,
        overflow: "visible",
      }}
    >
      <g
        opacity={prohibit.opacity}
        transform={`rotate(${prohibit.rotate}) scale(${prohibit.scale})`}
      >
        <circle
          cx={0}
          cy={0}
          r={RADIUS}
          fill="none"
          stroke={color.prohibit}
          strokeWidth={STROKE_WIDTH}
        />
        {/* 45度(左上→右下)の斜線。原点対称なので scaleX で中央から両側に伸びる */}
        <g transform="rotate(45)">
          <line
            x1={-OUTER_RADIUS}
            y1={0}
            x2={OUTER_RADIUS}
            y2={0}
            stroke={color.prohibit}
            strokeWidth={STROKE_WIDTH}
            transform={`scale(${slashScale} 1)`}
          />
        </g>
      </g>

      <g
        opacity={instruct.opacity}
        transform={`rotate(${instruct.rotate}) scale(${instruct.scale})`}
      >
        <circle cx={0} cy={0} r={OUTER_RADIUS} fill={color.instruct} />
        <path
          d={CHECK_PATH}
          fill="none"
          stroke={color.paper}
          strokeWidth={CHECK_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - checkProgress}
        />
      </g>
    </svg>
  );
};
