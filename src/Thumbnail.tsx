import { Sign } from "./components/Sign";
import { checkFieldLines, formatOverflow, isOverflowing } from "./lineCount";
import type { Episode } from "./schema";
import { color, fontSize, maxLines, safeArea, typography } from "./theme";

// サムネイルは動画本編と違い UI が被らないため <SafeArea> は使わないが、
// 文字は端から最低 60px 離す(Issue #15)。safeArea.left がちょうどその値なので使い回す。
const MARGIN = safeArea.left;

const SIGN_SIZE = 560;
// <Still> は常に frame=0 で描画されるため、<Sign> の登場アニメーションが
// 完了しきった状態(静止状態)に見えるよう appearAt を過去に振っておく(Issue #15)
const SIGN_SETTLED_APPEAR_AT = -60;

type ThumbnailProps = Episode;

// docs/spec.md §5, §13 / Issue #15: 「恋愛NG集 3選」+ 「{category} PART{part}」は
// エピソードJSONの category / part から組み立てる。サムネ専用の文言フィールドは追加しない。
export const Thumbnail: React.FC<ThumbnailProps> = ({ category, part }) => {
  const title = "恋愛NG集 3選";
  const subtitle = `${category} PART${part}`;

  const titleCheck = checkFieldLines(
    "thumbnail.title",
    [title],
    fontSize.thumbnailTitle,
    maxLines.thumbnailTitle,
  );
  if (isOverflowing(titleCheck)) {
    console.warn(formatOverflow(titleCheck));
  }
  const subtitleCheck = checkFieldLines(
    "thumbnail.subtitle",
    [subtitle],
    fontSize.thumbnailSubtitle,
    maxLines.thumbnailSubtitle,
  );
  if (isOverflowing(subtitleCheck)) {
    console.warn(formatOverflow(subtitleCheck));
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: color.ground,
        boxSizing: "border-box",
        padding: MARGIN,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ marginBottom: 72 }}>
        <Sign mode="prohibit" size={SIGN_SIZE} appearAt={SIGN_SETTLED_APPEAR_AT} />
      </div>
      <div style={{ ...typography.thumbnailTitle, color: color.paper, textAlign: "center" }}>
        {title}
      </div>
      <div
        style={{
          ...typography.thumbnailSubtitle,
          color: color.mute,
          textAlign: "center",
          marginTop: 24,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};
