import { Sequence } from "remotion";
import { FadeIn } from "../components/FadeIn";
import { Sign } from "../components/Sign";
import type { Item as ItemProps } from "../schema";
import { color, fontSize } from "../theme";

// Item 内の固定配分(12秒 = 360フレームを 3s/3s/4s/2s に分割)。
// フレーム数の直書きはこの1箇所に集約する(docs/spec.md §10 Phase1)。
const DECLARE_DURATION_IN_FRAMES = 90; // headline + sting
const FACT_DURATION_IN_FRAMES = 90;
const ACTION_DURATION_IN_FRAMES = 120;
const STAMP_DURATION_IN_FRAMES = 60;

const SIGN_SIZE = 340;

// Episode.tsx がシーンの尺を計算する際に参照する、Item 1件あたりの合計尺
export const ITEM_DURATION_IN_FRAMES =
  DECLARE_DURATION_IN_FRAMES +
  FACT_DURATION_IN_FRAMES +
  ACTION_DURATION_IN_FRAMES +
  STAMP_DURATION_IN_FRAMES;

// 標識は action の表示開始で prohibit → instruct に切り替わる(docs/spec.md §5.3)
const SIGN_SWITCH_AT_FRAME = DECLARE_DURATION_IN_FRAMES + FACT_DURATION_IN_FRAMES;

// 全 Item 共通の内部構造(docs/spec.md §4.2): 宣告 → 事実 → 行動 → スタンプ
export const Item: React.FC<ItemProps> = ({ no, headline, sting, fact, action, stamp }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontFamily: "monospace",
          fontSize: 40,
          color: color.mute,
        }}
      >
        {no < 10 ? `0${no}` : no}
      </div>

      {/* 標識は Item を通して出しっぱなしにし、切り替わりそのものを画面の主役にする */}
      <div style={{ marginTop: 80, flexShrink: 0 }}>
        <Sign mode="prohibit" switchAt={SIGN_SWITCH_AT_FRAME} size={SIGN_SIZE} />
      </div>

      {/* 残り領域の中央にテキストを置く。ブロックが入れ替わっても標識の位置は動かない */}
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Sequence layout="none" from={0} durationInFrames={DECLARE_DURATION_IN_FRAMES}>
          <FadeIn>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: fontSize.headline, fontWeight: 900, color: color.paper }}>
                {headline}
              </div>
              <div style={{ fontSize: fontSize.sting, color: color.prohibit, marginTop: 16 }}>
                {sting}
              </div>
            </div>
          </FadeIn>
        </Sequence>

        <Sequence
          layout="none"
          from={DECLARE_DURATION_IN_FRAMES}
          durationInFrames={FACT_DURATION_IN_FRAMES}
        >
          <FadeIn>
            <div style={{ textAlign: "center" }}>
              {fact.map((line, index) => (
                <div key={index} style={{ fontSize: fontSize.fact, color: color.mute }}>
                  {line}
                </div>
              ))}
            </div>
          </FadeIn>
        </Sequence>

        <Sequence
          layout="none"
          from={SIGN_SWITCH_AT_FRAME}
          durationInFrames={ACTION_DURATION_IN_FRAMES}
        >
          <FadeIn>
            <div
              style={{
                fontSize: fontSize.action,
                fontWeight: 900,
                color: color.instruct,
                textAlign: "center",
              }}
            >
              {action}
            </div>
          </FadeIn>
        </Sequence>

        <Sequence
          layout="none"
          from={SIGN_SWITCH_AT_FRAME + ACTION_DURATION_IN_FRAMES}
          durationInFrames={STAMP_DURATION_IN_FRAMES}
        >
          <FadeIn>
            <div style={{ fontSize: fontSize.stamp, color: color.paper, textAlign: "center" }}>
              {stamp}
            </div>
          </FadeIn>
        </Sequence>
      </div>
    </div>
  );
};
