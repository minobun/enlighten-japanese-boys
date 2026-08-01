import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import { color, fontSize, maxLines, typography } from "../theme";

type OutroProps = {
  outro: string[];
  nextTeaser: string;
  id: string;
  narrationLineCount: number;
  durationInFrames: number;
};

// docs/spec.md §4.2: 締め + 次回予告
// outro は headline と同じサイズ、nextTeaser は stamp と同じサイズで表示するため、
// 行数チェックもそれぞれの役割の maxLines を流用する。
export const Outro: React.FC<OutroProps> = ({
  outro,
  nextTeaser,
  id,
  narrationLineCount,
  durationInFrames,
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
      <Narration
        id={id}
        keyPrefix="outro"
        lineCount={narrationLineCount}
        durationInFrames={durationInFrames}
      />

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
