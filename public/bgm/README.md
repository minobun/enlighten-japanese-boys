# public/bgm/

BGM 音源ファイルを置く場所(docs/spec.md §13 / Issue #16)。

このディレクトリの中身は `.gitignore` でコミット対象外(この README のみコミット)。
音源ファイルの選定・ダウンロード・同梱はリポジトリオーナーが行う。

## 置き方

1. 著作権フリーの mp3 / wav ファイルをこのディレクトリに置く
2. `content/{id}.json` に `bgm` フィールドを追加する

```json
"bgm": {
  "file": "main.mp3",
  "volume": 0.1
}
```

- `file`: `public/bgm/` からの相対パス
- `volume`: 0〜1(省略時は 0.1。ナレーションを邪魔しない音量が目安)

ファイルが置かれていない場合は警告ログを出すだけで、BGM なしのままレンダリングされる。

## クレジット表記

素材のクレジットが必要な場合は、`content/{id}.json` の `credits` フィールドに書けば
`scripts/description.ts` が概要欄に自動で追記する(docs/spec.md §12 / Issue #14)。
