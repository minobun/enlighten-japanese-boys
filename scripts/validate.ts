import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FieldCheckResult } from "../src/lineCount";
import { checkFieldLines, formatOverflow, isOverflowing } from "../src/lineCount";
import { loadEpisode } from "../src/loadEpisode";
import type { Episode } from "../src/schema";
import { fontSize, maxLines } from "../src/theme";

const CONTENT_DIR = join(__dirname, "..", "content");

// content/ 以下は `{id}-何らかの説明.json` のような名前で置かれるため、
// ファイル名ではなく JSON 内の `id` フィールドで対象を探す(docs/spec.md §9)。
const findContentFile = (id: string): string => {
  const files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".json"));
  const match = files.find((name) => {
    try {
      const data = JSON.parse(readFileSync(join(CONTENT_DIR, name), "utf-8"));
      return data.id === id;
    } catch {
      return false;
    }
  });
  if (!match) {
    throw new Error(`content/ 以下に id="${id}" の JSON が見つからないのだ`);
  }
  return join(CONTENT_DIR, match);
};

// 画面に表示される全テキストフィールドを、実際に使われるフォントサイズ・行数上限で検査する
// (docs/spec.md §5.2)。判定ロジック自体は src/lineCount.ts に共通化し、シーン側の
// console.warn とロジックを揃える(Issue #7)。
const collectChecks = (episode: Episode): FieldCheckResult[] => {
  const checks: FieldCheckResult[] = [
    checkFieldLines("hook", episode.hook, fontSize.hook, maxLines.hook),
  ];

  for (const item of episode.items) {
    checks.push(
      checkFieldLines(`items[${item.no}].headline`, [item.headline], fontSize.headline, maxLines.headline),
      checkFieldLines(`items[${item.no}].sting`, [item.sting], fontSize.sting, maxLines.sting),
      checkFieldLines(`items[${item.no}].fact`, item.fact, fontSize.fact, maxLines.fact),
      checkFieldLines(`items[${item.no}].action`, [item.action], fontSize.action, maxLines.action),
      checkFieldLines(`items[${item.no}].stamp`, [item.stamp], fontSize.stamp, maxLines.stamp),
    );
  }

  checks.push(
    checkFieldLines("outro", episode.outro, fontSize.headline, maxLines.headline),
    checkFieldLines("nextTeaser", [episode.nextTeaser], fontSize.stamp, maxLines.stamp),
  );

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
};

main();
