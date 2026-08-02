import { Audio, getStaticFiles, Sequence, staticFile } from "remotion";
import type { SeCues } from "../se";

type SeTrackProps = {
  file: string; // public/se/ からの固定ファイル名(docs/spec.md §13 / Issue #17)
  cueFrames: number[]; // 動画先頭からの絶対フレーム。SeCues(src/se.ts)から渡される
  volume: number;
};

// 1種類の SE を、指定フレームで単発再生する。素材ファイルはオーナーが public/se/ に用意するものなので、
// 置かれていなければ警告ログを出すだけでレンダリングを続行する(クラッシュさせない)
const SeTrack: React.FC<SeTrackProps> = ({ file, cueFrames, volume }) => {
  const path = `se/${file}`;
  const exists = getStaticFiles().some((staticFileEntry) => staticFileEntry.name === path);

  if (!exists) {
    console.warn(
      `SE ファイルが見つからないのだ: public/${path}\npublic/se/README.md を確認して配置するのだ`,
    );
    return null;
  }

  return (
    <>
      {cueFrames.map((frame) => (
        <Sequence key={frame} layout="none" from={frame}>
          <Audio src={staticFile(path)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
};

type SeProps = {
  cues: SeCues;
  volume: number;
};

// 3種の SE(docs/spec.md §13 / Issue #17): stamp / switch / page。ファイルごとに独立して存在チェックする
export const Se: React.FC<SeProps> = ({ cues, volume }) => (
  <>
    <SeTrack file="stamp.wav" cueFrames={cues.stamp} volume={volume} />
    <SeTrack file="switch.wav" cueFrames={cues.signSwitch} volume={volume} />
    <SeTrack file="page.wav" cueFrames={cues.page} volume={volume} />
  </>
);
