import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { Sign } from "../components/Sign";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { SceneLayout } from "../metadata";
import { color, fontSize, maxLines, typography } from "../theme";

// Hook では標識は装飾。切り替えはさせず、小さめに置く(docs/spec.md §5.3)
const SIGN_SIZE = 200;

type HookProps = {
  hook: string[];
  id: string;
  layout: SceneLayout;
};

// docs/spec.md §4.2: 掴み。数字を大きく。
// 背景は Episode.tsx 側で color.ground を敷いているので、ここではテキストのみ扱う
// (この div は SafeArea の padding 済みコンテンツ領域を 100% で満たす通常フローの要素)。
export const Hook: React.FC<HookProps> = ({ hook, id, layout }) => {
  // 開発中に文字数オーバーへ気づけるようにする(docs/spec.md §5.2、判定ロジックは lineCount.ts に共通化)
  const hookCheck = checkFieldLines("hook", hook, fontSize.hook, maxLines.hook);
  if (isOverflowing(hookCheck)) {
    console.warn(formatOverflow(hookCheck));
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Narration id={id} lines={layout.lines} />

      <div style={{ marginBottom: 56 }}>
        <Sign mode="prohibit" size={SIGN_SIZE} />
      </div>

      <FadeIn>
        <div style={{ textAlign: "center" }}>
          {hook.map((line, index) => (
            <div
              key={index}
              style={{
                ...typography.hook,
                color: color.paper,
                lineHeight: 1.3,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
};
