import { getStaticFiles, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CharacterConfig, CharacterPose } from "../schema";
import { character as characterTheme } from "../theme";

// docs/spec.md §5.4: 登場は「フェード+4px上方向スライド」に統一する(<Sign>以外の例外は無い)
const APPEAR_TRANSITION_FRAMES = 6;
const APPEAR_SLIDE_DISTANCE_PX = 4;
// 表情切り替え(troubled/angry → normal)のクロスフェード。トランジションは6フレーム以内(docs/spec.md §5.4)
const SWITCH_TRANSITION_FRAMES = 6;
// 口パクの開閉トグル周期。<Sign> のアイドルアニメーション同様、spring を使わない単純な矩形波でよい
const MOUTH_TOGGLE_INTERVAL_FRAMES = 6;
// 喋っている間だけ乗せる、上下2pxのアイドル揺れ(sin波、spring不要)
const IDLE_BOB_PERIOD_FRAMES = 50;
const IDLE_BOB_AMPLITUDE_PX = 2;

type CharacterProps = {
  character: CharacterConfig | undefined;
  // <Sign> の switchAt と同じフレームで NG指摘の表情→通常表情に切り替える。未指定なら常に normal
  switchAt?: number;
  // 登場アニメーションの開始フレーム(シーン内の相対フレーム)
  appearAt?: number;
  // このフレームでナレーションが再生中かどうか(口パク・アイドル揺れに使う)
  speaking: boolean;
};

const poseBodyFile = (pose: CharacterPose): string =>
  typeof pose === "string" ? pose : pose.body;

const poseMouth = (pose: CharacterPose): { closed: string; open: string } | undefined =>
  typeof pose === "string" ? undefined : pose.mouth;

const staticFileExists = (path: string): boolean =>
  getStaticFiles().some((file) => file.name === path);

// body と口レイヤーは同じキャンバスサイズで書き出されている前提(坂本アヒル氏の PSD から
// フルキャンバスで PNG 書き出し)なので、同じボックスに重ねるだけで位置が合う
const layerStyle = (opacity: number): React.CSSProperties => ({
  position: "absolute",
  right: 0,
  bottom: 0,
  height: "100%",
  width: "auto",
  opacity,
});

// 1表情ぶんのレイヤー(body の上に口レイヤーを重ねる)。素材はオーナーが public/character/ に
// 用意するものなので、置かれていなければ描画をスキップする(クラッシュさせない)
const CharacterLayer: React.FC<{
  pose: CharacterPose;
  opacity: number;
  speaking: boolean;
  frame: number;
}> = ({ pose, opacity, speaking, frame }) => {
  const bodyPath = `character/${poseBodyFile(pose)}`;
  if (!staticFileExists(bodyPath)) {
    return null;
  }

  const mouth = poseMouth(pose);
  const mouthOpen = speaking && Math.floor(frame / MOUTH_TOGGLE_INTERVAL_FRAMES) % 2 === 1;
  const mouthPath = mouth ? `character/${mouthOpen ? mouth.open : mouth.closed}` : undefined;

  return (
    <>
      <Img src={staticFile(bodyPath)} style={layerStyle(opacity)} />
      {mouthPath !== undefined && staticFileExists(mouthPath) && (
        <Img src={staticFile(mouthPath)} style={layerStyle(opacity)} />
      )}
    </>
  );
};

// ずんだもんの立ち絵(docs/spec.md §13 / Issue #18)。シーンごとの個別分岐は書かず、
// 呼び出し側(Item/Hook/Outro)は <Sign> と同じ switchAt を渡すだけにする
export const Character: React.FC<CharacterProps> = ({
  character,
  switchAt,
  appearAt = 0,
  speaking,
}) => {
  const frame = useCurrentFrame();

  if (!character) {
    return null;
  }

  const normalPath = `character/${poseBodyFile(character.normal)}`;
  if (!staticFileExists(normalPath)) {
    console.warn(
      `立ち絵ファイルが見つからないのだ: public/${normalPath}\npublic/character/README.md を確認して配置するのだ`,
    );
    return null;
  }

  // switchAt より前は troubled → angry → normal の順にフォールバック。switchAt 以降は常に normal
  const fromPose = character.troubled ?? character.angry ?? character.normal;
  const toPose = character.normal;

  const switchProgress =
    switchAt === undefined
      ? 1
      : interpolate(frame, [switchAt, switchAt + SWITCH_TRANSITION_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const appear = interpolate(frame, [appearAt, appearAt + APPEAR_TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appearSlide = (1 - appear) * APPEAR_SLIDE_DISTANCE_PX;
  const idleBob = speaking
    ? Math.sin((frame / IDLE_BOB_PERIOD_FRAMES) * Math.PI * 2) * IDLE_BOB_AMPLITUDE_PX
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: characterTheme.bottomOffsetPx,
        height: characterTheme.baseHeightPx * character.scale,
        opacity: appear,
        transform: `translateY(${appearSlide + idleBob}px)`,
      }}
    >
      {switchProgress < 1 && (
        <CharacterLayer
          pose={fromPose}
          opacity={1 - switchProgress}
          speaking={speaking}
          frame={frame}
        />
      )}
      <CharacterLayer pose={toPose} opacity={switchProgress} speaking={speaking} frame={frame} />
    </div>
  );
};
