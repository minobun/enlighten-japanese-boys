import { Audio, getStaticFiles, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Episode } from "../schema";

type BgmProps = {
  bgm: NonNullable<Episode["bgm"]>;
  // フェードアウトの起点を出すためエピソード全体の尺・fps を受け取る
  durationInFrames: number;
  fps: number;
};

// 末尾1秒でフェードアウトする(docs/spec.md §13 / Issue #16)
const FADE_OUT_SEC = 1;

// エピソード全編に BGM を敷く。素材ファイルはオーナーが public/bgm/ に用意するものなので、
// 置かれていなければ警告ログを出すだけで BGM なしのレンダリングを続行する(クラッシュさせない)
export const Bgm: React.FC<BgmProps> = ({ bgm, durationInFrames, fps }) => {
  const path = `bgm/${bgm.file}`;
  const exists = getStaticFiles().some((file) => file.name === path);
  const frame = useCurrentFrame();

  if (!exists) {
    console.warn(
      `BGM ファイルが見つからないのだ: public/${path}\npublic/bgm/README.md を確認して配置するのだ`,
    );
    return null;
  }

  const fadeOutStart = durationInFrames - FADE_OUT_SEC * fps;
  const volume = interpolate(frame, [fadeOutStart, durationInFrames], [bgm.volume, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <Audio src={staticFile(path)} loop volume={volume} />;
};
