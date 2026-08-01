# enlighten-japanese-boys
自戒を込めて、人間関係でやってしまったミスを公開していこうのコーナー

## 新しいエピソードの作り方

1. `content/ep01-appearance-part1.json` をコピーして、新しい `id` を付ける
2. `hook` / `items` / `outro` / `narration` などの文言を書き換える
3. `pnpm run build:episode ep02` を実行する(`ep02` は新しい `id`)

内部で validate → 音声合成(差分のみ)→ タイミング算出 → レンダーを順に実行し、
成功すると `out/ep02.mp4` が出来上がる。レイアウトコードは一切触らなくてよい。
