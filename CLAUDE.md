# CLAUDE.md

## プロジェクト概要

YouTube Shorts「アラサー男性による恋愛NG集 3選」(1080x1920 / 30fps / 40〜50秒) を、**コンテンツJSONを書き換えるだけで量産する**システム。

**詳細仕様は `docs/spec.md`。実装判断に迷ったら必ず spec.md を正とする。** spec.md に書いていない判断が必要になったら、勝手に決めず PR やコメントで質問すること。

- 動画生成: Remotion v4 (React + TypeScript)
- 音声合成: VOICEVOX ENGINE (Docker・ローカル) / ずんだもん `speaker: 3`
- パッケージ管理: **pnpm**(npm / yarn は使わない)
- Node.js 20 以上

## コマンド

```bash
# VOICEVOX ENGINE 起動(音声合成に必須。GET :50021/version で疎通確認)
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest

pnpm studio                      # Remotion Studio でプレビュー
pnpm validate ep01               # 行数オーバーチェック
pnpm synthesize ep01             # narration を wav 化(キャッシュ付き)
pnpm timing ep01                 # 字幕タイミング算出
pnpm watch ep01                  # content/*.json を見張って合成+timingを自動でやり直す(studio と併用)
pnpm run build:episode ep01      # validate→合成→timing→render→概要欄 一気通貫
```

(スクリプトは Issue の進行に伴って追加される。未実装のものは対応する Issue を確認)

## 絶対に守るルール(spec.md §14「やらないこと」)

1. **項目は必ず3つ。** 増やさない。`schema.ts` の `.length(3)` を外さない
2. **フレーム数をハードコードしない。** 尺は `calculateMetadata` で音声長から自動算出する(Phase 4 以降)
3. **シーンごとに個別レイアウトを書かない。** シーンの型は1つ。PART2 以降でレイアウトコードを触る必要が出たらその設計は失敗
4. **画面テキストと読み上げ文を共用しない。** TTS に読ませるのは `narration` フィールドのみ。`headline` 等の画面テキストは合成しない
5. **Whisper を使わない。** 字幕タイミングは VOICEVOX AudioQuery のモーラ長から確定値で算出する
6. **色を直書きしない。** 色は `src/theme.ts` のトークンのみ。フォントサイズ・行数上限・セーフエリア値も theme.ts に集約
7. **セーフエリア厳守。** 上120 / 下260 / 右140 / 左60 px。テキストは全て `<SafeArea>` 内に置く
8. **ナレーションはずんだもん口調。**「〜のだ / 〜なのだ」調。「僕らみたいになるな」等の一人称複数は使わない(ずんだもん=指摘する側、視聴者=当事者)
9. **動きは統一。** テキストは「フェード + 4px 上方向スライド」のみ。例外は `<Sign>` の切り替えだけ。トランジションは6フレーム以内
10. **アニメーションはフレーム決定的に。** `useCurrentFrame()` + `spring()` / `interpolate()` を使う。CSS transition / requestAnimationFrame は使わない

## 開発ワークフロー

- **GitHub Issue 単位で実装する。** Issue は依存順に並んでいる(#1→#19)。各 Issue の「依存」欄に書かれた Issue がマージ済みであることを確認してから着手する
- **モデル指定:** `model:opus` ラベルの Issue(#6 Sign / #10 timing / #11 calculateMetadata)は難易度が高いため **Opus で実施**する。それ以外は Sonnet で実装可能なように書かれている
- **ブランチ → PR まで。** main に直接コミットしない。ブランチを切って実装し、PR 作成まで行う。**PR のレビュー・承認・マージは人間(リポジトリオーナー)が行う。自分でマージしない**
- PR には対応する Issue 番号(`Closes #N`)と、完了条件のチェック結果を書く
- **最終的な動画制作・YouTube への投稿は人間が行う。** 動作確認のためのテストレンダリング(`out/` への出力)は行ってよいが、それ以上(投稿・公開作業)には踏み込まない
- コミット前に型チェックを通す。`scripts/validate.ts` 実装後はそれも通す

## 実装フェーズ(spec.md §10)

一度に全部作らない。各フェーズ終了時に動作確認できる状態にする。

| Phase | 内容 | 完了条件 | Issue |
| --- | --- | --- | --- |
| 1 | 骨格(初期化 / theme / schema / SafeArea / シーン / ep01) | Studio で通しで見られる | #1〜#5 |
| 2 | ビジュアル(Sign / タイポグラフィ / 行数警告) | 静止画がサムネとして成立 | #6〜#7 |
| 3 | 音声(synthesize.ts / 音声載せ) | ずんだもんが喋る mp4 が出る | #8〜#9 |
| 4 | タイミング自動化(timing.ts / calculateMetadata / Caption) | JSON に1行足しても自動追従 | #10〜#12 |
| 5 | 量産導線(build:episode / description.ts) | JSON を置くだけで mp4 が出る | #13〜#14 |
| 任意 | サムネ / BGM / SE / 立ち絵 | — | #15〜#18 |
| Docs | README | 初見の人が mp4 を出せる | #19 |

## アセットとライセンス

- BGM(`public/bgm/`)・SE(`public/se/`)・立ち絵(`public/character/`)の**素材ファイルはオーナーが用意する**。実装側は「置かれていれば使う / 無ければスキップ」にし、素材のダウンロードや同梱はしない。素材ファイルはコミットしない
- 動画概要欄に **`VOICEVOX:ずんだもん`** のクレジットが必須(`scripts/description.ts` が自動付与)。このクレジットを外す変更は入れない
- Remotion は個人利用無償だが法人・チーム規模でライセンス購入が必要な場合がある(README に明記)

## 生成物の扱い

`public/audio/` `out/` `node_modules/` はコミットしない(.gitignore 済みであること)。ソースは `content/*.json` とコード。wav / query.json / timing.json / mp4 / png はすべて `content/*.json` から再生成可能。
