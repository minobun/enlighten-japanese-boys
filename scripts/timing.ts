import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { staleNarrationKeys } from "./audioHash";
import { findContentFile } from "./contentFile";
import { loadEpisode } from "../src/loadEpisode";
import type { AudioQuery, ChunkMode } from "../src/timing";
import { buildTiming } from "../src/timing";

// public/audio/{id}/*.query.json から字幕タイミングを算出して {key}.timing.json を書き出す
// (docs/spec.md §7 / Issue #10)。Whisper は使わず AudioQuery のモーラ長から確定値で出す。
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

// 算出値と wav 実長のズレ許容幅。ENGINE は音素長をサンプル単位に丸めるため完全一致はしない
const TOLERANCE_MS = 50;

const QUERY_SUFFIX = ".query.json";

const parseArgs = (): { id: string; mode: ChunkMode } => {
  const args = process.argv.slice(2);
  const modeIndex = args.findIndex((arg) => arg === "--mode" || arg.startsWith("--mode="));
  const modeValueIndex = modeIndex >= 0 && !args[modeIndex].includes("=") ? modeIndex + 1 : -1;
  const id = args.find(
    (arg, i) => !arg.startsWith("--") && i !== modeIndex && i !== modeValueIndex,
  );
  const modeValue =
    modeIndex < 0
      ? undefined
      : args[modeIndex].includes("=")
        ? args[modeIndex].split("=")[1]
        : args[modeIndex + 1];

  if (!id) {
    console.error("使い方: pnpm timing <id> [--mode punctuation|mora]  例: pnpm timing ep01");
    process.exit(1);
  }
  if (modeIndex >= 0 && modeValue !== "punctuation" && modeValue !== "mora") {
    console.error(`--mode は punctuation か mora なのだ(指定値: ${modeValue ?? "なし"})`);
    process.exit(1);
  }
  return { id, mode: modeValue === "mora" ? "mora" : "punctuation" };
};

// wav ヘッダ(RIFF チャンク)から再生秒数を読む。検証ログ用なので依存は増やさない
const wavDurationSec = (path: string): number | null => {
  const buffer = readFileSync(path);
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF") {
    return null;
  }
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      byteRate = buffer.readUInt32LE(offset + 16);
    }
    if (chunkId === "data") {
      return byteRate > 0 ? chunkSize / byteRate : null;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return null;
};

const main = () => {
  const { id, mode } = parseArgs();
  const dir = join(AUDIO_DIR, id);

  let keys: string[];
  try {
    keys = readdirSync(dir)
      .filter((name) => name.endsWith(QUERY_SUFFIX))
      .map((name) => name.slice(0, -QUERY_SUFFIX.length))
      .sort();
  } catch {
    console.error(`${dir} が無いのだ。先に \`pnpm synthesize ${id}\` を実行するのだ`);
    process.exit(1);
  }

  if (keys.length === 0) {
    console.error(`${dir} に query.json が無いのだ。先に \`pnpm synthesize ${id}\` を実行するのだ`);
    process.exit(1);
  }

  // narration を書き換えたのに合成し直していないと、字幕(content/*.json 由来)と
  // 音声(古い wav)が別の文章になったまま動画ができてしまうので、ここで止める
  const episode = loadEpisode(JSON.parse(readFileSync(findContentFile(id), "utf-8")));
  const stale = staleNarrationKeys(episode, dir);
  if (stale.length > 0) {
    console.error(
      `[${id}] narration と wav が食い違っているのだ(${stale.length}件): ${stale.join(", ")}\n` +
        `content/*.json の narration か voice を変えたあとに合成し直していないのだ。\n` +
        `\`pnpm synthesize ${id}\` を実行してから、もう一度 \`pnpm timing ${id}\` を実行するのだ`,
    );
    process.exit(1);
  }

  let maxDiffMs = 0;
  for (const key of keys) {
    const query: AudioQuery = JSON.parse(readFileSync(join(dir, `${key}${QUERY_SUFFIX}`), "utf-8"));
    const chunks = buildTiming(query, mode);
    writeFileSync(join(dir, `${key}.timing.json`), JSON.stringify(chunks, null, 2));

    const endMs = chunks[chunks.length - 1]?.endMs ?? 0;
    const wavSec = wavDurationSec(join(dir, `${key}.wav`));
    if (wavSec === null) {
      console.log(`[${id}] ${key}: ${chunks.length}塊 / ${endMs}ms(wav が読めず検証はスキップ)`);
      continue;
    }
    const diffMs = endMs - Math.round(wavSec * 1000);
    maxDiffMs = Math.max(maxDiffMs, Math.abs(diffMs));
    const mark = Math.abs(diffMs) <= TOLERANCE_MS ? "OK" : "要確認";
    console.log(
      `[${id}] ${key}: ${chunks.length}塊 / 算出 ${endMs}ms vs wav ${Math.round(wavSec * 1000)}ms ` +
        `(差 ${diffMs >= 0 ? "+" : ""}${diffMs}ms ${mark})`,
    );
  }

  console.log(
    `[${id}] 完了: ${keys.length}件(mode=${mode} / 最大ズレ ${maxDiffMs}ms / 許容 ${TOLERANCE_MS}ms)`,
  );
  if (maxDiffMs > TOLERANCE_MS) {
    console.warn(`[${id}] 許容幅を超えたキーがあるのだ。上の「要確認」行を見てほしいのだ`);
  }
};

main();
