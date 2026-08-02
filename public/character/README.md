# public/character/

ずんだもんの立ち絵画像を置く場所(docs/spec.md §13 / Issue #18)。

このディレクトリの中身は `.gitignore` でコミット対象外(この README のみコミット)。
画像の選定・ダウンロード・同梱はリポジトリオーナーが行う。

## 利用前チェックリスト(必須)

- [ ] 使用前に VOICEVOX / ずんだもん(東北ずん子・ずんだもんプロジェクト)の最新の利用ガイドラインを確認した
- [ ] ガイドラインが求めるクレジット表記を、`content/{id}.json` の `credits` フィールドに追加した(`scripts/description.ts` が概要欄に自動で追記する)
- [ ] 素材画像本体はコミットしていない

## 置き方

固定ファイル名ではなく、`content/{id}.json` の `character` フィールドでファイル名を指定する
(bgm と同じく、コード側にファイル名を決め打ちしない)。

表情は3種類まで(`normal` は必須、`troubled` / `angry` は任意)。口パクさせない表情は文字列1つ、
口パクさせる表情は口閉じ/口開きの2枚組で書く。

```json
"character": {
  "normal": "zundamon_normal.png",
  "troubled": { "closed": "zundamon_troubled_closed.png", "open": "zundamon_troubled_open.png" },
  "scale": 1
}
```

- `normal`: 必須。ベースの表情
- `troubled`: NGを指摘している間に使う表情(任意)
- `angry`: `troubled` が無い場合の代替(任意)
- `scale`: 表示サイズの倍率(省略時は1)

表情は揃っていなくてもよい。「`normal` のみ」「`normal` + `troubled` のみ」でも動作する
(揃っていない表情はフォールバック順どおりに `normal` が使われる)。

`normal` に対応する画像ファイルが置かれていない場合は、警告ログを出すだけで
立ち絵なしのままレンダリングされる(レンダリングは通る)。

## クレジット表記

素材のクレジットが必要な場合は、`content/{id}.json` の `credits` フィールドに書けば
`scripts/description.ts` が概要欄に自動で追記する(docs/spec.md §12 / Issue #14)。
