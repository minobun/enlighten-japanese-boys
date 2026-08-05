# public/illustrations/

item とまとめ(Outro)に表示するイラスト画像を置く場所(docs/spec.md 改善 / Issue #43 フォローアップ)。

このディレクトリの中身は `.gitignore` でコミット対象外(この README のみコミット)。
画像の選定・作成・同梱はリポジトリオーナーが行う。

## 置き方

固定ファイル名ではなく、`content/{id}.json` の `illustration` / `outroIllustration` フィールドで
ファイル名を指定する(bgm / 立ち絵と同じく、コード側にファイル名を決め打ちしない)。

1. 画像ファイル(png 等)をこのディレクトリに置く
2. `content/{id}.json` の該当する item に `illustration` フィールドを追加する

### item に1枚だけ出す

```json
"items": [
  {
    "no": 1,
    "headline": "剃った\"つもり\"の髭",
    "illustration": "item1.png"
  }
]
```

### 標識の切り替え(✕ → ✓)で絵も差し替える

`prohibit`(NGを指摘している間)と `instruct`(今日やることを出している間)の2枚を書くと、
**標識・背景・立ち絵と同じフレームで絵も差し替わる**(6フレームのクロスフェード)。

```json
"items": [
  {
    "no": 1,
    "headline": "剃った\"つもり\"の髭",
    "illustration": {
      "prohibit": "item1_ng.png",
      "instruct": "item1_ok.png"
    }
  }
]
```

### まとめ(Outro)に出す

エピソード直下に `outroIllustration` を書く。Outro は標識の切り替えが無いので1枚だけ。

```json
"outroIllustration": "outro.png"
```

- ファイル名はすべて `public/illustrations/` からの相対パス。いずれも任意フィールド

## 表示仕様

- 表示位置はキーワードタグの下。item 全体を通して出しっぱなしになり、
  上のキーワードタグだけがブロックごとに切り替わる
- 立ち絵(`character.enabled`)を出すときは左寄せでずんだもんと横に並び、出さないときは中央に置かれる
- 最大 560x560px の枠に収まるよう縮小される(`src/theme.ts` の `illustration`)。
  枠のサイズは固定なので、絵ごとに縦横比が違ってもまわりのレイアウトは動かない
- 縦横比は保たれるため、**背景透過 PNG・正方形に近い比率**が扱いやすい
- 登場時は他のテキストと同じフェード + 上方向スライドで表示される(docs/spec.md §9 の動きの統一)

## 未配置のとき

`illustration` / `outroIllustration` を書かない場合は、これまでどおりテキストのみで表示される。
ファイル名を書いたのに画像が置かれていない場合も、警告ログを出すだけで
イラストなしのままレンダリングされる(レンダリングは通る)。

`prohibit` / `instruct` のどちらか片方だけが置かれていない場合は、**置かれている側を
出したまま差し替えない**(切り替わった瞬間に絵が消えるのを避けるため)。

## クレジット表記

素材のクレジットが必要な場合は、`content/{id}.json` の `credits` フィールドに書けば
`scripts/description.ts` が概要欄に自動で追記する(docs/spec.md §12 / Issue #14)。
