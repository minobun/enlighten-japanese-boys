import { getStaticFiles, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Switchable } from "../schema";
import { instructValue, prohibitValue } from "../switchable";
import { illustration as illustrationTheme } from "../theme";
import { FadeIn } from "./FadeIn";

// item / まとめのイラスト(docs/spec.md 改善 / Issue #43フォローアップ)。
// 素材はオーナーが public/illustrations/ に用意するもので、実装側は
// 「置かれていれば使う/無ければスキップ」にする(docs/spec.md の素材の扱いに準拠)。
// 表示サイズは theme.ts に集約する(CLAUDE.md: サイズ値を各コンポーネントに散らさない)

// 禁止(✕)→ 指示(✓)の差し替え。<Sign> / <Character> と同じ 6フレーム以内(docs/spec.md §5.4)
const SWITCH_TRANSITION_FRAMES = 6;

type IllustrationProps = {
  illustration: Switchable | undefined; // 未指定なら何も描画しない
  // 標識と同じフレームで prohibit → instruct の絵に差し替える。
  // 未指定、または1枚だけ指定されている場合は差し替えない
  switchAt?: number;
};

const staticFileExists = (path: string): boolean =>
  getStaticFiles().some((f) => f.name === path);

// 1枚ぶんの画像。差し替えでクロスフェードさせるため、同じボックスに重ねて置く。
// path は呼び出し側で存在チェック済みのものを渡す
const IllustrationLayer: React.FC<{ path: string; opacity: number }> = ({ path, opacity }) => {
  return (
    <Img
      src={staticFile(path)}
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        maxHeight: "100%",
        maxWidth: "100%",
        objectFit: "contain",
        opacity,
      }}
    />
  );
};

export const Illustration: React.FC<IllustrationProps> = ({ illustration, switchAt }) => {
  const frame = useCurrentFrame();

  if (!illustration) {
    return null;
  }

  const fromPath = `illustrations/${prohibitValue(illustration)}`;
  const toPath = `illustrations/${instructValue(illustration)}`;
  const hasFrom = staticFileExists(fromPath);
  const hasTo = staticFileExists(toPath);

  if (!hasFrom && !hasTo) {
    console.warn(
      `イラストが見つからないのだ: public/${fromPath}\n見つかるまではテキスト表示のみになるのだ`,
    );
    return null;
  }

  // 絵が1枚しか無い(文字列指定)ときと、切り替えフレームが渡されないシーン(Outro)は差し替えない。
  // 片方のファイルがまだ置かれていない場合も、置かれている側を出したままにする(絵が消えるより良い)
  const switches = fromPath !== toPath && switchAt !== undefined && hasFrom && hasTo;
  const progress = switches
    ? interpolate(frame, [switchAt, switchAt + SWITCH_TRANSITION_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <FadeIn>
      {/* ボックスのサイズは固定する。絵ごとに縦横比が違っても周りのレイアウトが動かない */}
      <div
        style={{
          position: "relative",
          height: illustrationTheme.maxHeightPx,
          width: illustrationTheme.maxWidthPx,
        }}
      >
        {hasFrom && progress < 1 && <IllustrationLayer path={fromPath} opacity={1 - progress} />}
        {(switches || !hasFrom) && (
          <IllustrationLayer path={toPath} opacity={switches ? progress : 1} />
        )}
      </div>
    </FadeIn>
  );
};
