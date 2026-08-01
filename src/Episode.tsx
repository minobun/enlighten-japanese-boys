import { AbsoluteFill } from "remotion";
import { ProgressBar } from "./components/ProgressBar";
import { SafeArea } from "./components/SafeArea";
import type { Episode as EpisodeProps } from "./schema";

type Props = EpisodeProps & {
  debugSafeArea: boolean;
};

// Phase 1 プレースホルダ。シーン構成(Hook→Item×3→Outro)の組み立ては該当 Issue で行う(docs/spec.md §4.2)。
export const Episode: React.FC<Props> = ({ debugSafeArea }) => {
  return (
    <AbsoluteFill>
      <SafeArea debug={debugSafeArea} />
      <ProgressBar />
    </AbsoluteFill>
  );
};
