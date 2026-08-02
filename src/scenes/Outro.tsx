import { useCurrentFrame } from "remotion";
import { activeLineIndex, Caption } from "../components/Caption";
import { Character } from "../components/Character";
import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { SceneLayout } from "../metadata";
import type { CharacterConfig } from "../schema";
import { color, fontSize, maxLines, typography } from "../theme";

type OutroProps = {
  outro: string[];
  outroNarration: string[];
  nextTeaser: string;
  id: string;
  layout: SceneLayout;
  character: CharacterConfig | undefined;
};

// docs/spec.md §4.2: 締め + 次回予告
// outro は headline と同じサイズ、nextTeaser は stamp と同じサイズで表示するため、
// 行数チェックもそれぞれの役割の maxLines を流用する。
export const Outro: React.FC<OutroProps> = ({
  outro,
  outroNarration,
  nextTeaser,
  id,
  layout,
  character,
}) => {
  const outroCheck = checkFieldLines("outro", outro, fontSize.headline, maxLines.headline);
  if (isOverflowing(outroCheck)) {
    console.warn(formatOverflow(outroCheck));
  }
  const teaserCheck = checkFieldLines(
    "nextTeaser",
    [nextTeaser],
    fontSize.stamp,
    maxLines.stamp,
  );
  if (isOverflowing(teaserCheck)) {
    console.warn(formatOverflow(teaserCheck));
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
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Narration id={id} lines={layout.lines} />
      {currentLine >= 0 && (
        <Caption
          text={outroNarration[currentLine]}
          timing={layout.lines[currentLine].timing}
          startFrame={layout.lines[currentLine].from}
        />
      )}

      {/* Outro でも常に通常表情(switchAt なし。docs/spec.md §13 / Issue #18) */}
      <Character character={character} speaking={currentLine >= 0} />

      <FadeIn>
        <div style={{ textAlign: "center" }}>
          {outro.map((line, index) => (
            <div key={index} style={{ ...typography.headline, color: color.paper }}>
              {line}
            </div>
          ))}
        </div>
      </FadeIn>
      <FadeIn style={{ marginTop: 24 }}>
        <div style={{ ...typography.stamp, color: color.mute, textAlign: "center" }}>
          {nextTeaser}
        </div>
      </FadeIn>
    </div>
  );
};
