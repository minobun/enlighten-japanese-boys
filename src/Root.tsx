import { Composition } from "remotion";
import { Episode } from "./Episode";
import { calculateMetadata } from "./metadata";
import { type Episode as EpisodeProps, episodeSchema } from "./schema";

// Phase 1 プレースホルダ。schema を満たすダミー文言(#4 でシーン組み立てに合わせて調整)
const defaultProps: EpisodeProps = {
  id: "ep01",
  part: 1,
  category: "見た目編",
  hook: ["ダミーのフック"],
  items: [
    {
      no: 1,
      headline: "ダミー項目1",
      sting: "ダミーの一言",
      fact: ["ダミーの事実"],
      action: "ダミーの行動",
      stamp: "ダミーのスタンプ",
      narration: ["ダミーのナレーション"],
    },
    {
      no: 2,
      headline: "ダミー項目2",
      sting: "ダミーの一言",
      fact: ["ダミーの事実"],
      action: "ダミーの行動",
      stamp: "ダミーのスタンプ",
      narration: ["ダミーのナレーション"],
    },
    {
      no: 3,
      headline: "ダミー項目3",
      sting: "ダミーの一言",
      fact: ["ダミーの事実"],
      action: "ダミーの行動",
      stamp: "ダミーのスタンプ",
      narration: ["ダミーのナレーション"],
    },
  ],
  outro: ["ダミーの締め"],
  nextTeaser: "ダミーの次回予告",
};

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
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
