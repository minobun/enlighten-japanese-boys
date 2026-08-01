import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color } from "../theme";

const HEIGHT = 8;

// 画面最上部(セーフエリア外)に表示する進捗バー。UIに被っても支障がない装飾のため
// SafeArea の外側、上端0pxに重ねて配置する想定。
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(frame / Math.max(durationInFrames - 1, 1), 1);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEIGHT,
          backgroundColor: color.hairline,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: color.paper,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
