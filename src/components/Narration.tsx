import { Audio, getRemotionEnvironment, getStaticFiles, Sequence, staticFile } from "remotion";
import type { LineLayout } from "../metadata";
import { color, label } from "../theme";

type NarrationProps = {
  id: string;
  // 各行の開始フレーム・尺は calculateMetadata が音声実長から算出したものを受け取る
  // (docs/spec.md §8。ここで尺を決めないこと)
  lines: LineLayout[];
};

// narration 行を wav として順に再生する(docs/spec.md §6.2 のキー命名規則を使用)。
// シーンの型は1つに保つため、Hook / Item / Outro すべてこのコンポーネント経由で音声を再生する。
export const Narration: React.FC<NarrationProps> = ({ id, lines }) => {
  const { isStudio } = getRemotionEnvironment();
  const staticNames = new Set(getStaticFiles().map((file) => file.name));

  return (
    <>
      {lines.map(({ key, from, durationInFrames }) => {
        const path = `audio/${id}/${key}.wav`;

        if (!staticNames.has(path)) {
          const message = `音声ファイルが見つからないのだ: public/${path}\n先に \`pnpm synthesize ${id}\` を実行するのだ`;
          if (!isStudio) {
            throw new Error(message);
          }
          console.error(message);
          return (
            <Sequence key={key} layout="none" from={from} durationInFrames={durationInFrames}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  padding: 8,
                  ...label,
                  color: color.prohibit,
                  backgroundColor: color.ground,
                }}
              >
                音声未生成: {key}
              </div>
            </Sequence>
          );
        }

        return (
          <Sequence key={key} layout="none" from={from} durationInFrames={durationInFrames}>
            <Audio src={staticFile(path)} />
          </Sequence>
        );
      })}
    </>
  );
};
