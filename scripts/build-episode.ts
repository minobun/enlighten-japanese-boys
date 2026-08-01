import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findContentFile } from "./contentFile";
import { loadEpisode } from "../src/loadEpisode";

const ROOT_DIR = join(__dirname, "..");
const CONTENT_DIR = join(ROOT_DIR, "content");
const TSX_BIN = join(ROOT_DIR, "node_modules", ".bin", "tsx");

// content/ にある json 群の id 一覧(見つからない時の案内用。壊れたJSONは無視する)
const listContentIds = (): string[] => {
  const ids: string[] = [];
  for (const name of readdirSync(CONTENT_DIR).filter((n) => n.endsWith(".json"))) {
    try {
      const data = JSON.parse(readFileSync(join(CONTENT_DIR, name), "utf-8"));
      if (typeof data.id === "string") {
        ids.push(data.id);
      }
    } catch {
      // 一覧表示用なので壊れたJSONは黙って無視する
    }
  }
  return ids;
};

// content/{id}*.json を探して episodeSchema で検証する(docs/spec.md §9 / Issue #13)
const validateContent = (id: string): void => {
  let filePath: string;
  try {
    filePath = findContentFile(id);
  } catch {
    const ids = listContentIds();
    console.error(`[${id}] content/ に対応するJSONが見つからないのだ。`);
    console.error(
      ids.length > 0
        ? `存在する id: ${ids.join(", ")}`
        : "content/ にエピソードJSONが1つも無いのだ",
    );
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  loadEpisode(raw);
};

const runScript = (label: string, scriptPath: string, id: string): void => {
  console.log(`\n=== [${label}] 開始 ===`);
  try {
    execFileSync(TSX_BIN, [scriptPath, id], { cwd: ROOT_DIR, stdio: "inherit" });
  } catch {
    console.error(`\n=== [${label}] で失敗したのだ。ここで停止するのだ ===`);
    process.exit(1);
  }
  console.log(`=== [${label}] 完了 ===`);
};

const main = () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm run build:episode <id>  例: pnpm run build:episode ep01");
    process.exit(1);
  }

  console.log(`\n=== [1/7 content validate] 開始 ===`);
  validateContent(id);
  console.log(`=== [1/7 content validate] 完了 ===`);

  runScript("2/7 line-count validate", join(ROOT_DIR, "scripts", "validate.ts"), id);
  runScript("3/7 synthesize", join(ROOT_DIR, "scripts", "synthesize.ts"), id);
  runScript("4/7 timing", join(ROOT_DIR, "scripts", "timing.ts"), id);
  runScript("5/7 render", join(ROOT_DIR, "scripts", "render.ts"), id);
  runScript("6/7 thumbnail", join(ROOT_DIR, "scripts", "thumbnail.ts"), id);
  runScript("7/7 description", join(ROOT_DIR, "scripts", "description.ts"), id);

  console.log(`\n[${id}] ビルド完了なのだ: out/${id}.mp4 / out/${id}.thumbnail.png`);
};

main();
