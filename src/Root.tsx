import { Composition, Still } from "remotion";
import { z } from "zod";
import ep01Raw from "../content/ep01-appearance-part1.json";
import { Episode } from "./Episode";
import { loadEpisode } from "./loadEpisode";
import { calculateMetadata, FPS } from "./metadata";
import { episodeSchema } from "./schema";
import { Thumbnail } from "./Thumbnail";

// Studio 上でセーフエリアの境界線表示を切り替えるための開発用フラグ(docs/spec.md §3)。
// コンテンツ本体ではないため content/*.json のスキーマ(episodeSchema)には含めない。
const compositionSchema = episodeSchema.extend({
  debugSafeArea: z.boolean(),
});

type CompositionProps = z.infer<typeof compositionSchema>;

const ep01 = loadEpisode(ep01Raw);

const defaultProps: CompositionProps = {
  ...ep01,
  debugSafeArea: false,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Episode"
        component={Episode}
        // 尺(durationInFrames)は書かない。calculateMetadata が音声実長から算出する(docs/spec.md §8)
        fps={FPS}
        width={1080}
        height={1920}
        schema={compositionSchema}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      {/* docs/spec.md §13 / Issue #15: サムネイルを <Still> として動画と同時生成する */}
      <Still
        id="Thumbnail"
        component={Thumbnail}
        width={1080}
        height={1920}
        schema={episodeSchema}
        defaultProps={ep01}
      />
    </>
  );
};
