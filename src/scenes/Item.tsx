import { Sequence, useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { activeLineIndex, Caption } from "../components/Caption";
import { Character } from "../components/Character";
import { FadeIn } from "../components/FadeIn";
import { Narration } from "../components/Narration";
import { Sign } from "../components/Sign";
import { checkFieldLines, formatOverflow, isOverflowing } from "../lineCount";
import type { ItemLayout } from "../metadata";
import type { CharacterConfig, Item as ItemProps } from "../schema";
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

type ItemComponentProps = ItemProps & {
  id: string;
  layout: ItemLayout;
  character: CharacterConfig | undefined;
};

// 全 Item 共通の内部構造(docs/spec.md §4.2): 宣告 → 事実 → 行動 → スタンプ
export const Item: React.FC<ItemComponentProps> = ({
  no,
  headline,
  sting,
  fact,
  action,
  stamp,
  narration,
  id,
  layout,
  character,
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
        alignItems: "center",
      }}
    >
      {/* 背景アクセントも標識と同じフレームでNG(赤)→改善(青)に切り替える(docs/spec.md 改善 / Issue #43) */}
      <Background mode="prohibit" switchAt={actionBlock.from} />
      <Narration id={id} lines={layout.lines} />
      {currentLine >= 0 && (
        <Caption
          text={narration[currentLine]}
          timing={layout.lines[currentLine].timing}
          startFrame={layout.lines[currentLine].from}
        />
      )}

      {/* Item番号はカード化し、単色背景に意図的な余白として見せる(docs/spec.md 改善 / Issue #43) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          ...label,
          fontSize: 40,
          color: color.mute,
          padding: "6px 18px",
          borderRadius: 12,
          border: `1px solid ${color.hairline}`,
        }}
      >
        {no < 10 ? `0${no}` : no}
      </div>

      {/* 標識は Item を通して出しっぱなしにし、切り替わりそのものを画面の主役にする */}
      <div style={{ marginTop: 80, flexShrink: 0 }}>
        {/* 標識は action の表示開始で prohibit → instruct に切り替わる(docs/spec.md §5.3) */}
        <Sign mode="prohibit" switchAt={actionBlock.from} size={SIGN_SIZE} />
      </div>

      {/* 立ち絵の表情も標識と同じフレームで NG指摘→通常に切り替える(docs/spec.md §13 / Issue #18) */}
      <Character character={character} switchAt={actionBlock.from} speaking={currentLine >= 0} />

      {/* テキストは標識の直下(上寄せ)に置く。ブロックが入れ替わっても標識の位置は動かない。
          下半分は立ち絵と読み上げ字幕専用の領域として空けておく(docs/spec.md 改善 / Issue #42) */}
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 48,
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
              {/* 下部の読み上げ字幕が同じ内容を全文で読むため、中央は短いキーワードタグに留める(docs/spec.md 改善 / Issue #41) */}
              <div
                style={{
                  ...typography.keyword,
                  color: color.prohibit,
                  marginTop: 16,
                  display: "inline-block",
                  padding: "6px 20px",
                  borderRadius: 999,
                  border: `2px solid ${color.prohibit}`,
                }}
              >
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
            {/* 事実の全文は読み上げ字幕側が担うため、中央はキーワードタグの横並びに留める(docs/spec.md 改善 / Issue #41) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              {fact.map((line, index) => (
                <div
                  key={index}
                  style={{
                    ...typography.keyword,
                    color: color.mute,
                    padding: "6px 20px",
                    borderRadius: 999,
                    border: `2px solid ${color.hairline}`,
                  }}
                >
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
            {/* actionは「今日やること」として最も強調するが、読み上げ字幕と同文になるため
                全文パラグラフではなくキーワードタグで見せる(docs/spec.md §4.2 / Issue #41) */}
            <div
              style={{
                ...typography.keywordEmphasis,
                color: color.instruct,
                textAlign: "center",
                display: "inline-block",
                padding: "16px 32px",
                borderRadius: 999,
                border: `3px solid ${color.instruct}`,
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
            {/* 締めの一言も読み上げ字幕と同文になるため、控えめなキーワードタグで見せる(Issue #41) */}
            <div
              style={{
                ...typography.keyword,
                color: color.paper,
                textAlign: "center",
                display: "inline-block",
                padding: "6px 20px",
                borderRadius: 999,
                border: `2px solid ${color.hairline}`,
              }}
            >
              {stamp}
            </div>
          </FadeIn>
        </Sequence>
      </div>
    </div>
  );
};
