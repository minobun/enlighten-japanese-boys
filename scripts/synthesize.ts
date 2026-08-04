import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Manifest, VoiceParams } from "./audioHash";
import { hashLine, manifestPath as manifestPathOf, readManifest, voiceParams } from "./audioHash";
import { findContentFile } from "./contentFile";
import { loadEpisode } from "../src/loadEpisode";
import { narrationLines } from "../src/narration";

const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const ENGINE_URL = process.env.VOICEVOX_URL ?? "http://localhost:50021";
const SPEAKER_ID = 3; // ずんだもん・ノーマル(docs/spec.md §6.2)

type AudioQuery = Record<string, unknown>;

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

  const filePath = findContentFile(id);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const episode = loadEpisode(raw);
  const voice: VoiceParams = voiceParams(episode);

  const outDir = join(AUDIO_DIR, id);
  mkdirSync(outDir, { recursive: true });

  const manifestPath = manifestPathOf(outDir);
  const manifest: Manifest = readManifest(outDir);

  // キーの命名規則は src/narration.ts に集約(尺算出・再生側と同じキーを見る必要がある)
  const lines = narrationLines(episode);
  const nextManifest: Manifest = {};
  let synthCount = 0;
  let skipCount = 0;
  let engineChecked = false;

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

    // 全キャッシュ済みの場合はエンジン無しでも通したいので、実際に合成が必要になった時点で確認する
    if (!engineChecked) {
      await checkEngine();
      engineChecked = true;
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
