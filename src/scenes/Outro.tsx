import { FadeIn } from "../components/FadeIn";
import { color, fontSize } from "../theme";

type OutroProps = {
  outro: string[];
  nextTeaser: string;
};

// docs/spec.md §4.2: 締め + 次回予告
export const Outro: React.FC<OutroProps> = ({ outro, nextTeaser }) => {
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
      <FadeIn>
        <div style={{ textAlign: "center" }}>
          {outro.map((line, index) => (
            <div
              key={index}
              style={{ fontSize: fontSize.headline, fontWeight: 900, color: color.paper }}
            >
              {line}
            </div>
          ))}
        </div>
      </FadeIn>
      <FadeIn style={{ marginTop: 24 }}>
        <div style={{ fontSize: fontSize.stamp, color: color.mute, textAlign: "center" }}>
          {nextTeaser}
        </div>
      </FadeIn>
    </div>
  );
};
