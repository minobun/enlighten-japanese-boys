import { useCurrentFrame } from "remotion";
import { activeLineIndex, Caption } from "../components/Caption";
import { Character } from "../components/Character";
import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { Sign } from "../components/Sign";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { SceneLayout } from "../metadata";
import type { CharacterConfig } from "../schema";
import { color, fontSize, maxLines, typography } from "../theme";

// Hook では標識は装飾。切り替えはさせず、小さめに置く(docs/spec.md §5.3)
const SIGN_SIZE = 200;

type HookProps = {
  hook: string[];
  hookNarration: string[];
  id: string;
  layout: SceneLayout;
  character: CharacterConfig | undefined;
};

// docs/spec.md §4.2: 掴み。数字を大きく。
// 背景は Episode.tsx 側で color.ground を敷いているので、ここではテキストのみ扱う
// (この div は SafeArea の padding 済みコンテンツ領域を 100% で満たす通常フローの要素)。
export const Hook: React.FC<HookProps> = ({ hook, hookNarration, id, layout, character }) => {
  // 開発中に文字数オーバーへ気づけるようにする(docs/spec.md §5.2、判定ロジックは lineCount.ts に共通化)
  const hookCheck = checkFieldLines("hook", hook, fontSize.hook, maxLines.hook);
  if (isOverflowing(hookCheck)) {
    console.warn(formatOverflow(hookCheck));
  }

  const frame = useCurrentFrame();
  const currentLine = activeLineIndex(frame, layout.lines);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        // 標識・タイトルは上寄せにし、下半分を立ち絵と読み上げ字幕専用の領域として空ける
        // (docs/spec.md 改善 / Issue #42)
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 64,
      }}
    >
      <Narration id={id} lines={layout.lines} />
      {currentLine >= 0 && (
        <Caption
          text={hookNarration[currentLine]}
          timing={layout.lines[currentLine].timing}
          startFrame={layout.lines[currentLine].from}
        />
      )}

      <div style={{ marginBottom: 56 }}>
        <Sign mode="prohibit" size={SIGN_SIZE} />
      </div>

      {/* Hook では常に通常表情(switchAt なし。docs/spec.md §13 / Issue #18) */}
      <Character character={character} speaking={currentLine >= 0} />

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
