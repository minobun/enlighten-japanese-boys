import { getStaticFiles, Img, staticFile } from "remotion";
import { FadeIn } from "./FadeIn";

// item専用のイラスト(docs/spec.md 改善 / Issue #43フォローアップ)。
// 素材はオーナーが public/illustrations/ に用意するもので、実装側は
// 「置かれていれば使う/無ければスキップ」にする(docs/spec.md の素材の扱いに準拠)
const MAX_HEIGHT_PX = 320;

type IllustrationProps = {
  // public/illustrations/ からの相対パス。未指定なら何も描画しない
  file: string | undefined;
};

const staticFileExists = (path: string): boolean =>
  getStaticFiles().some((f) => f.name === path);

export const Illustration: React.FC<IllustrationProps> = ({ file }) => {
  if (!file) {
    return null;
  }

  const path = `illustrations/${file}`;
  if (!staticFileExists(path)) {
    console.warn(
      `イラストが見つからないのだ: public/${path}\n見つかるまではテキスト表示のみになるのだ`,
    );
    return null;
  }

  return (
    <FadeIn style={{ marginBottom: 24 }}>
      <Img src={staticFile(path)} style={{ maxHeight: MAX_HEIGHT_PX, maxWidth: "100%" }} />
    </FadeIn>
  );
};
