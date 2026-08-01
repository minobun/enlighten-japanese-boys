import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(__dirname, "..", "content");

// content/ 以下は `{id}-何らかの説明.json` のような名前で置かれるため、
// ファイル名ではなく JSON 内の `id` フィールドで対象を探す(docs/spec.md §9)
export const findContentFile = (id: string): string => {
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
