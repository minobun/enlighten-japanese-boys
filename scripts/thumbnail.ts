import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findContentFile } from "./contentFile";
import { loadEpisode } from "../src/loadEpisode";

const ROOT_DIR = join(__dirname, "..");
const REMOTION_BIN = join(ROOT_DIR, "node_modules", ".bin", "remotion");

// id を引数に取り、対応する content/*.json を Thumbnail Still の props として渡してレンダリングする
// (docs/spec.md §13, Issue #15)。実体は `remotion still Thumbnail out/{id}.thumbnail.png --props=...` 相当。
const main = () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm thumbnail <id>  例: pnpm thumbnail ep01");
    process.exit(1);
  }

  const filePath = findContentFile(id);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const episode = loadEpisode(raw);

  const propsDir = mkdtempSync(join(tmpdir(), "enlighten-thumbnail-"));
  const propsPath = join(propsDir, "props.json");
  writeFileSync(propsPath, JSON.stringify(episode));

  const outPath = join(ROOT_DIR, "out", `${id}.thumbnail.png`);

  execFileSync(REMOTION_BIN, ["still", "Thumbnail", outPath, `--props=${propsPath}`], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
};

main();
