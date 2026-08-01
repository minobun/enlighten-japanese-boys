import type { CSSProperties, PropsWithChildren } from "react";
import { interpolate, useCurrentFrame } from "remotion";

// docs/spec.md §5.4: カット間のトランジションは6フレーム以内
const TRANSITION_FRAMES = 6;
const SLIDE_DISTANCE_PX = 4;

type FadeInProps = PropsWithChildren<{
  // シーン(Sequence)内での相対フレームでのフェード開始タイミング
  delay?: number;
  style?: CSSProperties;
}>;

// docs/spec.md §5.4: テキストの動きは「フェード + 4px 上方向スライド」に統一する。
// 例外は <Sign> の切り替えのみ。全テキストはこのコンポーネント経由で表示すること。
export const FadeIn: React.FC<FadeInProps> = ({ delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        ...style,
        opacity: progress,
        transform: `translateY(${(1 - progress) * SLIDE_DISTANCE_PX}px)`,
      }}
    >
      {children}
    </div>
  );
};
