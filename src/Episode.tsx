import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Bgm } from "./components/Bgm";
import { ProgressBar } from "./components/ProgressBar";
import { SafeArea } from "./components/SafeArea";
import { Se } from "./components/Se";
import type { EpisodeLayout } from "./metadata";
import { fallbackLayout } from "./metadata";
import type { Episode as EpisodeContent } from "./schema";
import { Hook } from "./scenes/Hook";
import { Item } from "./scenes/Item";
import { Outro } from "./scenes/Outro";
import { buildSeCues } from "./se";
import { color, seVolume } from "./theme";

type Props = EpisodeContent & {
  debugSafeArea: boolean;
  // calculateMetadata が音声実長から算出したレイアウト(docs/spec.md §8)。
  // 算出前に描画された場合に備えて optional にし、その場合は音声無しの仮レイアウトで描く
  layout?: EpisodeLayout;
};

// docs/spec.md §4.2: Hook → Item×3 → Outro を通しで組み立てる。
// 全シーンを <SafeArea> でラップし、装飾である <ProgressBar> はセーフエリア外に重ねる。
// シーン・ブロックの開始フレームと尺は全て props の layout から来る(ここで尺を決めないこと)。
export const Episode: React.FC<Props> = (props) => {
  const {
    id,
    hook,
    hookNarration,
    items,
    outro,
    outroNarration,
    outroIllustration,
    nextTeaser,
    debugSafeArea,
    layout,
    bgm,
    character,
  } = props;
  const { fps } = useVideoConfig();
  const resolved = layout ?? fallbackLayout(props, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: color.ground }}>
      {bgm && <Bgm bgm={bgm} durationInFrames={resolved.durationInFrames} fps={fps} />}
      <Se cues={buildSeCues(resolved)} volume={seVolume} />
      <SafeArea debug={debugSafeArea}>
        <Sequence
          layout="none"
          from={resolved.hook.from}
          durationInFrames={resolved.hook.durationInFrames}
        >
          <Hook
            hook={hook}
            hookNarration={hookNarration}
            id={id}
            layout={resolved.hook}
            character={character}
          />
        </Sequence>
        {items.map((item, index) => {
          const itemLayout = resolved.items[index];
          return (
            <Sequence
              key={item.no}
              layout="none"
              from={itemLayout.from}
              durationInFrames={itemLayout.durationInFrames}
            >
              <Item {...item} id={id} layout={itemLayout} character={character} />
            </Sequence>
          );
        })}
        <Sequence
          layout="none"
          from={resolved.outro.from}
          durationInFrames={resolved.outro.durationInFrames}
        >
          <Outro
            outro={outro}
            outroNarration={outroNarration}
            outroIllustration={outroIllustration}
            nextTeaser={nextTeaser}
            id={id}
            layout={resolved.outro}
            character={character}
          />
        </Sequence>
      </SafeArea>
      <ProgressBar />
    </AbsoluteFill>
  );
};
