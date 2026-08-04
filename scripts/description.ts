import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findContentFile } from "./contentFile";
import { loadEpisode } from "../src/loadEpisode";
import type { Episode } from "../src/schema";
import { prohibitValue } from "../src/switchable";

const ROOT_DIR = join(__dirname, "..");
const OUT_DIR = join(ROOT_DIR, "out");

// ライセンス上必須のクレジット表記(docs/spec.md §12)。この行を外す変更は入れない
const VOICEVOX_CREDIT = "VOICEVOX:ずんだもん";
const HASHTAGS = ["#Shorts", "#恋愛", "#ずんだもん"];

// content/{id}.json から概要欄テキストを組み立てる(docs/spec.md §12 / Issue #14)
export const buildDescription = (episode: Episode): string => {
  const lines: string[] = [];

  lines.push(`アラサー男性による恋愛NG集 3選【${episode.category} PART${episode.part}】`);
  lines.push("");
  for (const item of episode.items) {
    // 見出しが差し替え式(prohibit / instruct)の場合、概要欄には NG 側の言い方を載せる
    lines.push(`・${prohibitValue(item.headline)}`);
  }
  lines.push("");
  lines.push(episode.nextTeaser);
  lines.push("");
  if (episode.credits) {
    lines.push(...episode.credits);
  }
  lines.push(VOICEVOX_CREDIT);
  lines.push("");
  lines.push(HASHTAGS.join(" "));

  return lines.join("\n");
};

const main = () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm description <id>  例: pnpm description ep01");
    process.exit(1);
  }

  const filePath = findContentFile(id);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const episode = loadEpisode(raw);

  const description = buildDescription(episode);

  // クレジット行が欠けた出力を作らない(docs/spec.md §12 で必須要件)
  if (!description.includes(VOICEVOX_CREDIT)) {
    throw new Error(`概要欄テキストに "${VOICEVOX_CREDIT}" が含まれていないのだ。生成を中止するのだ`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${id}.description.txt`);
  writeFileSync(outPath, description);
  console.log(`[${id}] 概要欄テキストを書き出したのだ: out/${id}.description.txt`);
};

main();
