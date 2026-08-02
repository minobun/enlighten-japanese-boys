# public/illustrations/

item ごとに中央へ表示するイラスト画像を置く場所(docs/spec.md 改善 / Issue #43 フォローアップ)。

このディレクトリの中身は `.gitignore` でコミット対象外(この README のみコミット)。
画像の選定・作成・同梱はリポジトリオーナーが行う。

## 置き方

固定ファイル名ではなく、`content/{id}.json` の各 item の `illustration` フィールドで
ファイル名を指定する(bgm / 立ち絵と同じく、コード側にファイル名を決め打ちしない)。

1. 画像ファイル(png 等)をこのディレクトリに置く
2. `content/{id}.json` の該当する item に `illustration` フィールドを追加する

```json
"items": [
  {
    "no": 1,
    "headline": "剃った\"つもり\"の髭",
    "illustration": "item1.png"
  }
]
```

- `illustration`: `public/illustrations/` からの相対パス。任意フィールド

## 表示仕様

- 表示位置は標識の直下(中央)。item 全体を通して出しっぱなしになり、
  下のキーワードタグだけがブロックごとに切り替わる
- 高さは最大 320px に収まるよう縮小される(`src/components/Illustration.tsx` の `MAX_HEIGHT_PX`)。
  横幅も表示領域を超えないように収まる
- 縦横比は保たれるため、**背景透過 PNG・正方形〜横長**が扱いやすい
- 登場時は他のテキストと同じフェード + 上方向スライドで表示される(docs/spec.md §9 の動きの統一)

## 未配置のとき

`illustration` を書かない item は、これまでどおりテキストのみで表示される。
`illustration` にファイル名を書いたのに画像が置かれていない場合も、警告ログを出すだけで
イラストなしのままレンダリングされる(レンダリングは通る)。

## クレジット表記

素材のクレジットが必要な場合は、`content/{id}.json` の `credits` フィールドに書けば
`scripts/description.ts` が概要欄に自動で追記する(docs/spec.md §12 / Issue #14)。
