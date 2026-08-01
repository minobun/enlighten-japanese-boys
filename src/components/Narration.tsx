import {
  Audio,
  getRemotionEnvironment,
  getStaticFiles,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { color, label } from "../theme";

// 行間の目安(docs/spec.md §10 Phase3, Issue #9)。正確な尺合わせは Phase4(#11)で
// AudioQuery の実長を使って自動化するため、ここでは均等割り + 小さな間隔に留める。
const GAP_IN_SECONDS = 0.15;

type NarrationProps = {
  id: string;
  keyPrefix: string; // "hook" | `item${no}` | "outro"(#8 のキー命名規則)
  lineCount: number;
  durationInFrames: number;
};

// narration 行を wav として順に再生する(docs/spec.md §6.2 のキー命名規則を使用)。
// シーンの型は1つに保つため、Hook / Item / Outro すべてこのコンポーネント経由で音声を再生する。
export const Narration: React.FC<NarrationProps> = ({
  id,
  keyPrefix,
  lineCount,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  const { isStudio } = getRemotionEnvironment();
  const staticNames = new Set(getStaticFiles().map((file) => file.name));

  const gapInFrames = Math.round(GAP_IN_SECONDS * fps);
  const slot = Math.max(
    1,
    Math.floor((durationInFrames - gapInFrames * (lineCount - 1)) / lineCount),
  );

  return (
    <>
      {Array.from({ length: lineCount }, (_, index) => {
        const key = `${keyPrefix}_${index + 1}`;
        const path = `audio/${id}/${key}.wav`;
        const from = index * (slot + gapInFrames);
        const durationForLine = Math.min(slot, durationInFrames - from);

        if (!staticNames.has(path)) {
          const message = `音声ファイルが見つからないのだ: public/${path}\n先に \`pnpm synthesize ${id}\` を実行するのだ`;
          if (!isStudio) {
            throw new Error(message);
          }
          console.error(message);
          return (
            <Sequence key={key} layout="none" from={from} durationInFrames={durationForLine}>
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
          <Sequence key={key} layout="none" from={from} durationInFrames={durationForLine}>
            <Audio src={staticFile(path)} />
          </Sequence>
        );
      })}
    </>
  );
};
