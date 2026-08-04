import { interpolate, useCurrentFrame } from "remotion";
import type { Switchable } from "../schema";
import { instructValue, prohibitValue } from "../switchable";
import { color, headlineRowHeightPx, typography } from "../theme";
import { FadeIn } from "./FadeIn";

// item の見出し。prohibit / instruct のペアで書かれていれば、標識・イラストと同じフレームで
// 「NGの言い方」→「やることの言い方」に差し替える(<Illustration> と同じ扱い)。
// 差し替えは <Sign> / <Character> と同じ 6フレーム以内(docs/spec.md §5.4)
const SWITCH_TRANSITION_FRAMES = 6;

type HeadlineProps = {
  headline: Switchable;
  // 標識と同じフレームで差し替える。1つしか書かれていない場合は差し替えない
  switchAt?: number;
};

// 差し替えのクロスフェード用に2つを重ねるので、どちらも絶対配置で中央に置く
const HeadlineLayer: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...typography.headline,
      lineHeight: 1.3,
      color: color.paper,
      textAlign: "center",
      opacity,
    }}
  >
    {text}
  </div>
);

export const Headline: React.FC<HeadlineProps> = ({ headline, switchAt }) => {
  const frame = useCurrentFrame();

  const from = prohibitValue(headline);
  const to = instructValue(headline);
  const switches = from !== to && switchAt !== undefined;
  const progress = switches
    ? interpolate(frame, [switchAt, switchAt + SWITCH_TRANSITION_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    // 中身を絶対配置で重ねるので、枠側で幅を確保しないと折り返し幅が 0 になる
    <FadeIn style={{ width: "100%" }}>
      {/* 高さは上限行数ぶんで固定する。1行の見出しと2行の見出しが入れ替わっても
          下のイラストが上下に動かないようにするため */}
      <div style={{ position: "relative", width: "100%", height: headlineRowHeightPx }}>
        {progress < 1 && <HeadlineLayer text={from} opacity={1 - progress} />}
        {switches && <HeadlineLayer text={to} opacity={progress} />}
      </div>
    </FadeIn>
  );
};
