import { Composition } from "remotion";
import { Episode } from "./Episode";
import { calculateMetadata } from "./metadata";
import { episodeSchema } from "./schema";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Episode"
      component={Episode}
      // 尺は仮の固定値(Phase 4 で calculateMetadata による自動算出に置き換える。docs/spec.md §8)
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      schema={episodeSchema}
      defaultProps={{}}
      calculateMetadata={calculateMetadata}
    />
  );
};
