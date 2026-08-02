# enlighten-japanese-boys

自戒を込めて、人間関係でやってしまったミスを公開していこうのコーナー

YouTube Shorts「アラサー男性による恋愛NG集 3選」(1080x1920 / 30fps / 40〜50秒) を、
**`content/*.json` を書き換えるだけ**で量産するシステム。JSON を1本用意して
コマンドを1つ実行すれば、ずんだもんが喋る mp4・サムネイル画像・YouTube 概要欄のテキストが出来上がる。

詳細な設計判断は [`docs/spec.md`](docs/spec.md) を参照。

## セットアップ

- Node.js 20 以上
- パッケージ管理は **pnpm**(npm / yarn は使わない)

```bash
pnpm install
```

音声合成には VOICEVOX ENGINE(Docker)が必要。別ターミナルで起動しておく。

```bash
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

起動確認は `GET http://localhost:50021/version` が応答すること。

## 使い方

### プレビュー(Remotion Studio)

```bash
pnpm studio
```

ブラウザで Studio が開き、シーン構成やタイミングを確認できる。

### エピソードを1本ビルドする

VOICEVOX ENGINE を起動した状態で:

```bash
pnpm run build:episode ep01
```

`content/ep01-appearance-part1.json` を入力に、以下を自動で順に実行する。

1. content の JSON スキーマ検証
2. 行数オーバー検証(`pnpm validate`)
3. VOICEVOX による音声合成(`pnpm synthesize`。キャッシュ付きなので2回目以降は差分のみ)
4. 字幕タイミング算出(`pnpm timing`)
5. mp4 レンダリング(`out/ep01.mp4`)
6. サムネイル画像レンダリング(`out/ep01.thumbnail.png`)
7. 概要欄テキスト生成(`out/ep01.description.txt`)

途中の工程が失敗した場合はそこで停止する。レイアウトコードは一切触らなくてよい。

### 新しいエピソードを追加する

1. `content/ep01-appearance-part1.json` をコピーして、新しい `id`(例: `ep02`)を付ける
2. `hook` / `items` / `outro` / `narration` などの文言を書き換える
   - 画面に表示するテキストと読み上げ文は別フィールド。ずんだもんに読ませたい文章は必ず `narration` に書く
3. `pnpm run build:episode ep02` を実行する

JSON に行を足しても尺は音声の長さから自動算出されるため、フレーム数を手で調整する必要はない。

## アセットの置き方(BGM / SE / 立ち絵)

BGM・効果音・立ち絵の素材ファイルはリポジトリオーナーが用意するものでコミットされていない。
置けば使われ、無ければ警告ログを出してスキップされるだけでビルドは通る。

- BGM: [`public/bgm/README.md`](public/bgm/README.md)
- 効果音(SE): [`public/se/README.md`](public/se/README.md)
- 立ち絵: 未実装(対応する Issue が完了次第このセクションに追記する)

## ライセンス・クレジット(必須・投稿前に確認)

### VOICEVOX

- 動画の概要欄に **`VOICEVOX:ずんだもん`** のクレジットが必須。`pnpm run build:episode` の最終工程
  (`scripts/description.ts`)が `out/{id}.description.txt` に自動で付与する
- 収益化・キャラクター利用の可否は [VOICEVOX 公式](https://voicevox.hiroshiba.jp/)および
  [ずんだもんの利用ガイドライン](https://zunko.jp/con_ongen_kiyaku.html)の**最新版**を、投稿前に必ず確認すること
  (規約は更新されるため、このドキュメントの記載を鵜呑みにしない)

### Remotion

- 個人利用は無償だが、法人・チーム規模によってはライセンス購入が必要な場合がある。詳細は
  [Remotion License](https://www.remotion.dev/license) を確認すること

## 投稿前チェックリスト

- [ ] `out/{id}.description.txt` に `VOICEVOX:ずんだもん` のクレジットが入っている
- [ ] `out/{id}.mp4` を再生し、セーフエリア(上120 / 下260 / 右140 / 左60 px)にテキストが被っていない
- [ ] 尺が目安の40〜50秒に収まっている(音声内容の都合で外れる場合は許容するが、大きくずれる場合は narration を見直す)
- [ ] BGM / SE / 立ち絵を使った場合、素材のクレジットが `content/{id}.json` の `credits` 経由で概要欄に反映されている
