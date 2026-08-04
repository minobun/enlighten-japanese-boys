import { useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { activeLineIndex, Caption } from "../components/Caption";
import { Character, characterVisibleIn } from "../components/Character";
import { FadeIn } from "../components/FadeIn";
import { Illustration } from "../components/Illustration";
import { Narration } from "../components/Narration";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { SceneLayout } from "../metadata";
import type { CharacterConfig } from "../schema";
import { color, fontSize, maxLines, typography } from "../theme";

type OutroProps = {
  outro: string[] | undefined;
  outroNarration: string[];
  outroIllustration: string | undefined;
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
  outroIllustration,
  nextTeaser,
  id,
  layout,
  character,
}) => {
  if (outro) {
    const outroCheck = checkFieldLines("outro", outro, fontSize.headline, maxLines.headline);
    if (isOverflowing(outroCheck)) {
      console.warn(formatOverflow(outroCheck));
    }
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
        // 締めの文言は上寄せにし、下半分を立ち絵と読み上げ字幕専用の領域として空ける
        // (docs/spec.md 改善 / Issue #42)
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 96,
      }}
    >
      {/* Outroは解決後の締めなので常に改善(青)アクセント(docs/spec.md 改善 / Issue #43) */}
      <Background mode="instruct" />
      <Narration id={id} lines={layout.lines} />
      {currentLine >= 0 && (
        <Caption
          text={outroNarration[currentLine]}
          timing={layout.lines[currentLine].timing}
          startFrame={layout.lines[currentLine].from}
        />
      )}

      {/* Outro でも常に通常表情(switchAt なし。docs/spec.md §13 / Issue #18)。
          まとめはずんだもんに中央で喋らせる(オーナー判断) */}
      <Character
        character={character}
        scene="outro"
        placement="center"
        speaking={currentLine >= 0}
      />

      {/* 締めの画面文言は任意。省略された場合は次回予告と立ち絵だけになる */}
      {outro && (
        <FadeIn>
          <div style={{ textAlign: "center" }}>
            {outro.map((line, index) => (
              <div key={index} style={{ ...typography.headline, color: color.paper }}>
                {line}
              </div>
            ))}
          </div>
        </FadeIn>
      )}
      <FadeIn style={{ marginTop: 24 }}>
        <div style={{ ...typography.stamp, color: color.mute, textAlign: "center" }}>
          {nextTeaser}
        </div>
      </FadeIn>

      {/* まとめのイラスト(あれば)。Item と同じ扱いで、立ち絵を出すときは
          右下のずんだもんと横に並べたいので左寄せ、出さないときは中央に置く */}
      <div
        style={{
          alignSelf: characterVisibleIn(character, "outro") ? "flex-start" : "center",
          marginTop: 24,
        }}
      >
        <Illustration illustration={outroIllustration} />
      </div>
    </div>
  );
};
