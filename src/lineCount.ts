import { safeArea } from "./theme";

// 使用可能幅(docs/spec.md §5.2): 1080 − 左60 − 右140
const USABLE_WIDTH_PX = 1080 - safeArea.left - safeArea.right;

// 日本語は全角前提で1文字 ≒ fontSizePx として概算する(docs/spec.md §5.2)。
export const estimateLineCount = (line: string, fontSizePx: number): number =>
  Math.max(1, Math.ceil((line.length * fontSizePx) / USABLE_WIDTH_PX));

export type LineEstimate = {
  // 入力配列(またはテキストを改行で割ったもの)の何行目か(1始まり)
  lineNumber: number;
  text: string;
  estimatedLines: number;
};

export type FieldCheckResult = {
  field: string;
  totalLines: number;
  maxLines: number;
  lines: LineEstimate[];
};

// scripts/validate.ts とシーンコンポーネント双方から使う共通の行数判定(docs/spec.md §5.2)。
// inputLines は画面上ですでに改行される単位(配列項目、または改行を含む1文字列を割ったもの)。
export const checkFieldLines = (
  field: string,
  inputLines: string[],
  fontSizePx: number,
  maxLines: number,
): FieldCheckResult => {
  const lines = inputLines.map((text, index) => ({
    lineNumber: index + 1,
    text,
    estimatedLines: estimateLineCount(text, fontSizePx),
  }));
  const totalLines = lines.reduce((sum, line) => sum + line.estimatedLines, 0);
  return { field, totalLines, maxLines, lines };
};

export const isOverflowing = (result: FieldCheckResult): boolean =>
  result.totalLines > result.maxLines;

// 「どのフィールドの何行目が何行になるか」を明示するメッセージ(docs/spec.md §5.2, Issue #7)
export const formatOverflow = (result: FieldCheckResult): string => {
  const detail = result.lines
    .map((line) => `  ${line.lineNumber}行目(${line.estimatedLines}行相当): "${line.text}"`)
    .join("\n");
  return `${result.field} が行数オーバーです: 想定 ${result.totalLines}行 / 上限 ${result.maxLines}行\n${detail}`;
};
