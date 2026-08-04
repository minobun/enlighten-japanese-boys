import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { narrationLines } from "../src/narration";
import { defaultVoice } from "../src/schema";
import type { Episode } from "../src/schema";

// wav キャッシュの鍵。narration の文面と VOICEVOX パラメータの両方から作るので、
// どちらかが変われば別の wav として扱われる(scripts/synthesize.ts のキャッシュ判定)。
// 合成(synthesize)と鮮度チェック(timing)で同じ計算を使う必要があるためここに集約する。
export type VoiceParams = typeof defaultVoice;
export type Manifest = Record<string, string>;

export const hashLine = (text: string, voice: VoiceParams): string =>
  createHash("sha256").update(JSON.stringify({ text, voice })).digest("hex");

export const voiceParams = (episode: Episode): VoiceParams => ({
  ...defaultVoice,
  ...episode.voice,
});

export const manifestPath = (audioDir: string): string => join(audioDir, "manifest.json");

export const readManifest = (audioDir: string): Manifest => {
  const path = manifestPath(audioDir);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : {};
};

// content/*.json の narration と、public/audio/{id}/ に置かれている wav がズレている行を返す。
// narration を書き換えたのに合成し直していないと、字幕(JSON 由来)と音声(古い wav)が
// 食い違ったまま動画ができてしまうため、それを検出するために使う
export const staleNarrationKeys = (episode: Episode, audioDir: string): string[] => {
  const manifest = readManifest(audioDir);
  const voice = voiceParams(episode);

  return narrationLines(episode)
    .filter(({ key, text }) => manifest[key] !== hashLine(text, voice))
    .map(({ key }) => key);
};
