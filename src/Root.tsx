import { Composition } from "remotion";
import { z } from "zod";
import ep01Raw from "../content/ep01-appearance-part1.json";
import { Episode, TOTAL_DURATION_IN_FRAMES } from "./Episode";
import { loadEpisode } from "./loadEpisode";
import { calculateMetadata } from "./metadata";
import { episodeSchema } from "./schema";

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
    <Composition
      id="Episode"
      component={Episode}
      // 尺は仮の固定値(Phase 4 で calculateMetadata による自動算出に置き換える。docs/spec.md §8)
      durationInFrames={TOTAL_DURATION_IN_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      schema={compositionSchema}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
