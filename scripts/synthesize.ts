import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEpisode } from "../src/loadEpisode";
import type { Episode } from "../src/schema";
import { defaultVoice } from "../src/schema";

const CONTENT_DIR = join(__dirname, "..", "content");
const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const ENGINE_URL = process.env.VOICEVOX_URL ?? "http://localhost:50021";
const SPEAKER_ID = 3; // ずんだもん・ノーマル(docs/spec.md §6.2)

type VoiceParams = typeof defaultVoice;
type AudioQuery = Record<string, unknown>;
type Manifest = Record<string, string>;
type NarrationLine = { key: string; text: string };

// content/ 以下は `{id}-何らかの説明.json` のような名前で置かれるため、
// id 前方一致でファイルを探す(Issue #8)
const findContentFile = (id: string): string => {
  const files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".json"));
  const matches = files.filter((name) => name === `${id}.json` || name.startsWith(`${id}-`));
  if (matches.length === 0) {
    throw new Error(`content/ 以下に id="${id}" に前方一致する JSON が見つからないのだ`);
  }
  if (matches.length > 1) {
    throw new Error(
      `id="${id}" に前方一致する JSON が複数見つかったのだ: ${matches.join(", ")}`,
    );
  }
  return join(CONTENT_DIR, matches[0]);
};

const checkEngine = async (): Promise<void> => {
  try {
    const res = await fetch(`${ENGINE_URL}/version`);
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
  } catch {
    console.error(`VOICEVOX ENGINE (${ENGINE_URL}) に接続できないのだ。\n`);
    console.error("以下のコマンドでエンジンを起動してから再実行するのだ:\n");
    console.error(
      "  docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest\n",
    );
    process.exit(1);
  }
};

// narration の行単位でキーを振る(Issue #8。#10 の字幕タイミング算出もこの命名に依存する)
const buildNarrationLines = (episode: Episode): NarrationLine[] => {
  const lines: NarrationLine[] = [];
  episode.hookNarration.forEach((text, i) => lines.push({ key: `hook_${i + 1}`, text }));
  for (const item of episode.items) {
    item.narration.forEach((text, i) => lines.push({ key: `item${item.no}_${i + 1}`, text }));
  }
  episode.outroNarration.forEach((text, i) => lines.push({ key: `outro_${i + 1}`, text }));
  return lines;
};

const hashLine = (text: string, voice: VoiceParams): string =>
  createHash("sha256").update(JSON.stringify({ text, voice })).digest("hex");

const fetchAudioQuery = async (text: string): Promise<AudioQuery> => {
  const url = `${ENGINE_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER_ID}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`audio_query に失敗したのだ(status ${res.status}): "${text}"`);
  }
  return res.json();
};

const fetchSynthesis = async (query: AudioQuery): Promise<ArrayBuffer> => {
  const url = `${ENGINE_URL}/synthesis?speaker=${SPEAKER_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!res.ok) {
    throw new Error(`synthesis に失敗したのだ(status ${res.status})`);
  }
  return res.arrayBuffer();
};

const main = async () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm synthesize <id>  例: pnpm synthesize ep01");
    process.exit(1);
  }

  await checkEngine();

  const filePath = findContentFile(id);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const episode = loadEpisode(raw);
  const voice: VoiceParams = { ...defaultVoice, ...episode.voice };

  const outDir = join(AUDIO_DIR, id);
  mkdirSync(outDir, { recursive: true });

  const manifestPath = join(outDir, "manifest.json");
  const manifest: Manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf-8"))
    : {};

  const lines = buildNarrationLines(episode);
  const nextManifest: Manifest = {};
  let synthCount = 0;
  let skipCount = 0;

  for (const { key, text } of lines) {
    const hash = hashLine(text, voice);
    const wavPath = join(outDir, `${key}.wav`);
    const queryPath = join(outDir, `${key}.query.json`);
    nextManifest[key] = hash;

    if (manifest[key] === hash && existsSync(wavPath) && existsSync(queryPath)) {
      console.log(`[${id}] ${key}: skip`);
      skipCount += 1;
      continue;
    }

    const query = await fetchAudioQuery(text);
    const finalQuery: AudioQuery = { ...query, ...voice };
    const wav = await fetchSynthesis(finalQuery);

    writeFileSync(wavPath, Buffer.from(wav));
    writeFileSync(queryPath, JSON.stringify(finalQuery, null, 2));
    console.log(`[${id}] ${key}: synth`);
    synthCount += 1;
  }

  writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2));
  console.log(`[${id}] 完了: 合成 ${synthCount}件 / スキップ ${skipCount}件`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
