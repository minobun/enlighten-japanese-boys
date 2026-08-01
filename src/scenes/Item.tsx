import { Sequence } from "remotion";
import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { Sign } from "../components/Sign";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { ItemLayout } from "../metadata";
import type { Item as ItemProps } from "../schema";
import { color, fontSize, label, maxLines, typography } from "../theme";

// 宣告 / 事実 / 行動 / スタンプ各ブロックの開始・尺は calculateMetadata が narration の
// 音声実長から算出する(docs/spec.md §8)。このファイルでフレーム数を決めないこと。

const SIGN_SIZE = 340;

// 開発中に文字数オーバーへ気づけるようにする(docs/spec.md §5.2、判定ロジックは lineCount.ts に共通化)
const warnIfOverflowing = (field: string, inputLines: string[], role: keyof typeof fontSize) => {
  const result = checkFieldLines(field, inputLines, fontSize[role], maxLines[role]);
  if (isOverflowing(result)) {
    console.warn(formatOverflow(result));
  }
};

type ItemComponentProps = ItemProps & { id: string; layout: ItemLayout };

// 全 Item 共通の内部構造(docs/spec.md §4.2): 宣告 → 事実 → 行動 → スタンプ
export const Item: React.FC<ItemComponentProps> = ({
  no,
  headline,
  sting,
  fact,
  action,
  stamp,
  id,
  layout,
}) => {
  const {
    declare: declareBlock,
    fact: factBlock,
    action: actionBlock,
    stamp: stampBlock,
  } = layout.blocks;

  warnIfOverflowing(`items[${no}].headline`, [headline], "headline");
  warnIfOverflowing(`items[${no}].sting`, [sting], "sting");
  warnIfOverflowing(`items[${no}].fact`, fact, "fact");
  warnIfOverflowing(`items[${no}].action`, [action], "action");
  warnIfOverflowing(`items[${no}].stamp`, [stamp], "stamp");

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
      <Narration id={id} lines={layout.lines} />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          ...label,
          fontSize: 40,
          color: color.mute,
        }}
      >
        {no < 10 ? `0${no}` : no}
      </div>

      {/* 標識は Item を通して出しっぱなしにし、切り替わりそのものを画面の主役にする */}
      <div style={{ marginTop: 80, flexShrink: 0 }}>
        {/* 標識は action の表示開始で prohibit → instruct に切り替わる(docs/spec.md §5.3) */}
        <Sign mode="prohibit" switchAt={actionBlock.from} size={SIGN_SIZE} />
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
        <Sequence
          layout="none"
          from={declareBlock.from}
          durationInFrames={declareBlock.durationInFrames}
        >
          <FadeIn>
            <div style={{ textAlign: "center" }}>
              <div style={{ ...typography.headline, color: color.paper }}>{headline}</div>
              <div style={{ ...typography.sting, color: color.prohibit, marginTop: 16 }}>
                {sting}
              </div>
            </div>
          </FadeIn>
        </Sequence>

        <Sequence
          layout="none"
          from={factBlock.from}
          durationInFrames={factBlock.durationInFrames}
        >
          <FadeIn>
            <div style={{ textAlign: "center" }}>
              {fact.map((line, index) => (
                <div key={index} style={{ ...typography.fact, color: color.mute }}>
                  {line}
                </div>
              ))}
            </div>
          </FadeIn>
        </Sequence>

        <Sequence
          layout="none"
          from={actionBlock.from}
          durationInFrames={actionBlock.durationInFrames}
        >
          <FadeIn>
            <div
              style={{
                ...typography.action,
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
          from={stampBlock.from}
          durationInFrames={stampBlock.durationInFrames}
        >
          <FadeIn>
            <div style={{ ...typography.stamp, color: color.paper, textAlign: "center" }}>
              {stamp}
            </div>
          </FadeIn>
        </Sequence>
      </div>
    </div>
  );
};
