import { AbsoluteFill } from "remotion";
import type { Episode as EpisodeProps } from "./schema";

// Phase 1 プレースホルダ。シーン構成の組み立ては該当 Issue で行う(docs/spec.md §4.2)。
export const Episode: React.FC<EpisodeProps> = () => {
  return <AbsoluteFill />;
};
