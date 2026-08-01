import { AbsoluteFill, Sequence } from "remotion";
import { ProgressBar } from "./components/ProgressBar";
import { SafeArea } from "./components/SafeArea";
import type { Episode as EpisodeContent } from "./schema";
import { Hook } from "./scenes/Hook";
import { Item, ITEM_DURATION_IN_FRAMES } from "./scenes/Item";
import { Outro } from "./scenes/Outro";
import { color } from "./theme";

type Props = EpisodeContent & {
  debugSafeArea: boolean;
};

// シーン(Hook / Item×3 / Outro)の尺はこの1箇所に集約する(docs/spec.md §10 Phase1)。
// Phase4(#11)で calculateMetadata による音声長ベースの自動算出に置き換える。
const FPS = 30;
const HOOK_DURATION_IN_FRAMES = 2 * FPS;
const OUTRO_DURATION_IN_FRAMES = 4 * FPS;
const ITEM_COUNT = 3;

export const TOTAL_DURATION_IN_FRAMES =
  HOOK_DURATION_IN_FRAMES + ITEM_DURATION_IN_FRAMES * ITEM_COUNT + OUTRO_DURATION_IN_FRAMES;

// docs/spec.md §4.2: Hook → Item×3 → Outro を通しで組み立てる。
// 全シーンを <SafeArea> でラップし、装飾である <ProgressBar> はセーフエリア外に重ねる。
export const Episode: React.FC<Props> = ({
  id,
  hook,
  hookNarration,
  items,
  outro,
  outroNarration,
  nextTeaser,
  debugSafeArea,
}) => {
  const hookFrom = 0;
  const itemFroms = items.map(
    (_, index) => hookFrom + HOOK_DURATION_IN_FRAMES + index * ITEM_DURATION_IN_FRAMES,
  );
  const outroFrom = hookFrom + HOOK_DURATION_IN_FRAMES + ITEM_DURATION_IN_FRAMES * items.length;

  return (
    <AbsoluteFill style={{ backgroundColor: color.ground }}>
      <SafeArea debug={debugSafeArea}>
        <Sequence layout="none" from={hookFrom} durationInFrames={HOOK_DURATION_IN_FRAMES}>
          <Hook
            hook={hook}
            id={id}
            narrationLineCount={hookNarration.length}
            durationInFrames={HOOK_DURATION_IN_FRAMES}
          />
        </Sequence>
        {items.map((item, index) => (
          <Sequence
            key={item.no}
            layout="none"
            from={itemFroms[index]}
            durationInFrames={ITEM_DURATION_IN_FRAMES}
          >
            <Item {...item} id={id} />
          </Sequence>
        ))}
        <Sequence layout="none" from={outroFrom} durationInFrames={OUTRO_DURATION_IN_FRAMES}>
          <Outro
            outro={outro}
            nextTeaser={nextTeaser}
            id={id}
            narrationLineCount={outroNarration.length}
            durationInFrames={OUTRO_DURATION_IN_FRAMES}
          />
        </Sequence>
      </SafeArea>
      <ProgressBar />
    </AbsoluteFill>
  );
};
