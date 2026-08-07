import { readFileSync } from "node:fs";
import { findContentFile } from "./contentFile";
import type { FieldCheckResult } from "../src/lineCount";
import { checkFieldLines, formatOverflow, isOverflowing } from "../src/lineCount";
import { loadEpisode } from "../src/loadEpisode";
import type { Episode } from "../src/schema";
import { switchableValues } from "../src/switchable";
import { fontSize, maxLines } from "../src/theme";
import { checkWritingRules, formatViolation } from "../src/writingRules";

// 画面に表示される全テキストフィールドを、実際に使われるフォントサイズ・行数上限で検査する
// (docs/spec.md §5.2)。判定ロジック自体は src/lineCount.ts に共通化し、シーン側の
// console.warn とロジックを揃える(Issue #7)。
const collectChecks = (episode: Episode): FieldCheckResult[] => {
  const checks: FieldCheckResult[] = [
    checkFieldLines("hook", episode.hook, fontSize.hook, maxLines.hook),
  ];

  for (const item of episode.items) {
    // item で画面に出るのは headline だけ(sting / fact / action / stamp は読み上げ字幕に任せ、
    // 中央には出さなくなった)。行数チェックも画面に出るものだけを見る
    // 見出しは差し替え前後の両方(prohibit / instruct)を検査する
    for (const text of switchableValues(item.headline)) {
      checks.push(
        checkFieldLines(`items[${item.no}].headline`, [text], fontSize.headline, maxLines.headline),
      );
    }
  }

  if (episode.outro) {
    checks.push(checkFieldLines("outro", episode.outro, fontSize.headline, maxLines.headline));
  }
  checks.push(checkFieldLines("nextTeaser", [episode.nextTeaser], fontSize.stamp, maxLines.stamp));

  return checks;
};

const main = () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm validate <id>  例: pnpm validate ep01");
    process.exit(1);
  }

  const filePath = findContentFile(id);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const episode = loadEpisode(raw);

  const checks = collectChecks(episode);
  const overflowing = checks.filter(isOverflowing);

  if (overflowing.length > 0) {
    console.error(`[${id}] 行数オーバーが見つかったのだ:\n`);
    for (const result of overflowing) {
      console.error(formatOverflow(result));
      console.error("");
    }
    process.exit(1);
  }

  console.log(`[${id}] 行数チェックOK(${checks.length}件)`);

  // 執筆規約(docs/spec.md §4.3)は警告に留める。ep01〜ep03 は作り直さない方針なので
  // ここで exit 1 すると既存エピソードの build:episode が通らなくなる(docs/spec.md §4.4)
  const violations = checkWritingRules(episode);
  if (violations.length > 0) {
    console.warn(`\n[${id}] 執筆規約から外れているところがあるのだ(${violations.length}件):\n`);
    for (const violation of violations) {
      console.warn(formatViolation(violation));
      console.warn("");
    }
    console.warn(
      "ep01〜ep03 は作り直さない方針なので警告のみなのだ(docs/spec.md §4.3)。\n" +
        "新しく書いたエピソードなら、書き出す前に直すのだ",
    );
    return;
  }

  console.log(`[${id}] 執筆規約チェックOK(docs/spec.md §4.3)`);
};

main();
