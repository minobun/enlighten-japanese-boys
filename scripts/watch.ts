import { execFileSync } from "node:child_process";
import { watch } from "node:fs";
import { basename, dirname, join } from "node:path";
import { findContentFile } from "./contentFile";

// content/{id}*.json を見張って、変わったら合成とタイミング算出をやり直す(Issue #13 の導線の補助)。
// `pnpm run build:episode` は mp4 を作るときに同じことを通しでやるが、Remotion Studio で
// プレビューしながら narration や voice.speedScale をいじる間は wav が古いままになるため、
// このスクリプトを別ターミナルで走らせておく。
//
//   ターミナル1: pnpm studio
//   ターミナル2: pnpm watch ep01
//
// wav は「文面 + voice パラメータ」のハッシュでキャッシュされるので(scripts/audioHash.ts)、
// 変わった行だけが合成し直される。speedScale を変えた場合は全行が対象になる。
const ROOT_DIR = join(__dirname, "..");
const TSX_BIN = join(ROOT_DIR, "node_modules", ".bin", "tsx");

// エディタの保存は「書き込み → リネーム」など複数イベントに分かれるので、まとめて1回にする
const DEBOUNCE_MS = 300;

const runScript = (script: string, id: string): boolean => {
  try {
    execFileSync(TSX_BIN, [join(ROOT_DIR, "scripts", script), id], {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
    return true;
  } catch {
    return false;
  }
};

// 合成 → タイミング算出。失敗しても watch は止めず、直して保存し直せば再実行されるようにする
const sync = (id: string): void => {
  console.log(`\n=== [${id}] 変更を検知したのだ。合成し直すのだ ===`);
  if (!runScript("synthesize.ts", id)) {
    console.error(`=== [${id}] 合成に失敗したのだ。直したらまた保存するのだ ===`);
    return;
  }
  if (!runScript("timing.ts", id)) {
    console.error(`=== [${id}] タイミング算出に失敗したのだ。直したらまた保存するのだ ===`);
    return;
  }
  console.log(`=== [${id}] 反映したのだ。Studio を再読み込みするのだ ===`);
};

const main = () => {
  const id = process.argv[2];
  if (!id) {
    console.error("使い方: pnpm watch <id>  例: pnpm watch ep01");
    process.exit(1);
  }

  const contentPath = findContentFile(id);
  const fileName = basename(contentPath);

  // ファイル自体ではなくディレクトリを見張る。エディタによっては保存時にファイルが
  // 作り直されて、ファイル監視だと以降の変更を取りこぼすため
  let timer: NodeJS.Timeout | undefined;
  let running = false;
  let pending = false;

  const schedule = (): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (running) {
        pending = true;
        return;
      }
      running = true;
      try {
        sync(id);
        // 合成中に保存された分をここで拾う
        while (pending) {
          pending = false;
          sync(id);
        }
      } finally {
        running = false;
      }
    }, DEBOUNCE_MS);
  };

  watch(dirname(contentPath), (_event, changed) => {
    if (changed === fileName) {
      schedule();
    }
  });

  console.log(`[${id}] ${contentPath} を見張るのだ(Ctrl+C で終了)`);
  console.log(`[${id}] まず現状に合わせておくのだ`);
  sync(id);
};

main();
