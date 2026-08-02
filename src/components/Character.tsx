import { getStaticFiles, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CharacterConfig, CharacterPose } from "../schema";

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

// 基準の高さ。character.scale で調整する
const CHARACTER_HEIGHT_PX = 400;
// 左下配置。左は <SafeArea> の padding で既に確保済み。下は 260px セーフエリアの内側かつ
// <Caption> の字幕テキスト(最大2行程度)と重ならない余白を確保する
const BOTTOM_OFFSET_PX = 190;

type CharacterProps = {
  character: CharacterConfig | undefined;
  // <Sign> の switchAt と同じフレームで NG指摘の表情→通常表情に切り替える。未指定なら常に normal
  switchAt?: number;
  // 登場アニメーションの開始フレーム(シーン内の相対フレーム)
  appearAt?: number;
  // このフレームでナレーションが再生中かどうか(口パク・アイドル揺れに使う)
  speaking: boolean;
};

const isTwoFramePose = (pose: CharacterPose): pose is { closed: string; open: string } =>
  typeof pose !== "string";

const poseFile = (pose: CharacterPose, mouthOpen: boolean): string =>
  isTwoFramePose(pose) ? (mouthOpen ? pose.open : pose.closed) : pose;

const staticFileExists = (path: string): boolean =>
  getStaticFiles().some((file) => file.name === path);

// 立ち絵素材はオーナーが public/character/ に用意するものなので、置かれていなければ
// 警告ログを出すだけでレンダリングを続行する(クラッシュさせない)
const CharacterLayer: React.FC<{
  pose: CharacterPose;
  opacity: number;
  speaking: boolean;
  frame: number;
}> = ({ pose, opacity, speaking, frame }) => {
  const mouthOpen =
    isTwoFramePose(pose) &&
    speaking &&
    Math.floor(frame / MOUTH_TOGGLE_INTERVAL_FRAMES) % 2 === 1;
  const path = `character/${poseFile(pose, mouthOpen)}`;

  if (!staticFileExists(path)) {
    return null;
  }

  return (
    <Img
      src={staticFile(path)}
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        height: "100%",
        width: "auto",
        opacity,
      }}
    />
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

  const normalBaseFile = poseFile(character.normal, false);
  const normalPath = `character/${normalBaseFile}`;
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
        left: 0,
        bottom: BOTTOM_OFFSET_PX,
        height: CHARACTER_HEIGHT_PX * character.scale,
        opacity: appear,
        transform: `translateY(${appearSlide + idleBob}px)`,
      }}
    >
      {switchProgress < 1 && (
        <CharacterLayer pose={fromPose} opacity={1 - switchProgress} speaking={speaking} frame={frame} />
      )}
      <CharacterLayer pose={toPose} opacity={switchProgress} speaking={speaking} frame={frame} />
    </div>
  );
};
