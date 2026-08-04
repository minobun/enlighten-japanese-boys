import { useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { activeLineIndex, Caption } from "../components/Caption";
import { Character, characterVisibleIn } from "../components/Character";
import { FadeIn } from "../components/FadeIn";
import { Illustration } from "../components/Illustration";
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

// 全 Item 共通の内部構造(docs/spec.md §4.2): 宣告 → 事実 → 行動 → スタンプ。
// 画面に出すのは見出しとイラストだけで、sting / fact / action / stamp の文言は
// 読み上げ字幕(<Caption>)と同じ内容になるため中央には出さない(オーナー判断)。
// ブロックの区切りは「標識・背景・立ち絵・イラストがどのフレームで切り替わるか」にだけ使う。
export const Item: React.FC<ItemComponentProps> = ({
  no,
  headline,
  narration,
  illustration,
  id,
  layout,
  character,
}) => {
  const { action: actionBlock } = layout.blocks;

  warnIfOverflowing(`items[${no}].headline`, [headline], "headline");

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
      <Character
        character={character}
        scene="item"
        switchAt={actionBlock.from}
        speaking={currentLine >= 0}
      />

      {/* 見出しとイラストは標識の直下(上寄せ)に置く。どちらも Item を通して出しっぱなしなので、
          ブロックが入れ替わっても画面は動かない。下半分は立ち絵と読み上げ字幕専用の領域として
          空けておく(docs/spec.md 改善 / Issue #42) */}
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
        <FadeIn>
          <div style={{ ...typography.headline, color: color.paper, textAlign: "center" }}>
            {headline}
          </div>
        </FadeIn>

        {/* itemごとのイラスト(あれば)。prohibit / instruct の2枚が指定されていれば、
            標識・背景・立ち絵と同じフレームで絵も差し替わる(docs/spec.md 改善 / Issue #43フォローアップ)。
            立ち絵を出すときは右下のずんだもんと横に並べたいので左寄せ、出さないときは中央に置く */}
        <div
          style={{
            alignSelf: characterVisibleIn(character, "item") ? "flex-start" : "center",
            marginTop: 24,
          }}
        >
          <Illustration illustration={illustration} switchAt={actionBlock.from} />
        </div>
      </div>
    </div>
  );
};
