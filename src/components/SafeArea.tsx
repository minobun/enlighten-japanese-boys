import type { PropsWithChildren } from "react";
import { AbsoluteFill } from "remotion";
import { color, safeArea } from "../theme";

type SafeAreaProps = PropsWithChildren<{
  // Studio 上で境界を可視化するデバッグ表示(docs/spec.md §3)
  debug?: boolean;
}>;

// 全シーンはこのコンポーネントでラップする。セーフエリア(上120/下260/右140/左60)ぶんの
// padding を持つ全画面コンテナ。
export const SafeArea: React.FC<SafeAreaProps> = ({ debug = false, children }) => {
  return (
    <AbsoluteFill
      style={{
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
        paddingRight: safeArea.right,
        paddingLeft: safeArea.left,
      }}
    >
      {children}
      {debug && (
        <div
          style={{
            position: "absolute",
            top: safeArea.top,
            bottom: safeArea.bottom,
            right: safeArea.right,
            left: safeArea.left,
            border: `2px dashed ${color.prohibit}`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
