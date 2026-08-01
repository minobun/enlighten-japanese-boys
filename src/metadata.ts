import type { CalculateMetadataFunction } from "remotion";
import type { Episode } from "./schema";

type Props = Episode & {
  debugSafeArea: boolean;
};

// Phase 1 プレースホルダ。尺の自動算出は該当 Issue で行う(docs/spec.md §8)。
export const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};
