# public/se/

効果音(SE)ファイルを置く場所(docs/spec.md §13 / Issue #17)。

このディレクトリの中身は `.gitignore` でコミット対象外(この README のみコミット)。
音源ファイルの選定・ダウンロード・同梱はリポジトリオーナーが行う。

## 置き方

固定ファイル名でこのディレクトリに wav ファイルを置く。`content/{id}.json` 側の変更は不要。

| ファイル名 | 鳴らすタイミング |
| --- | --- |
| `stamp.wav` | 標識が prohibit で登場する瞬間(Item の宣告) |
| `switch.wav` | 標識が prohibit → instruct に切り替わる瞬間(action 表示) |
| `page.wav` | シーン切り替わり(Hook→Item1、Item間、→Outro) |

再生位置はすべて `calculateMetadata`(Issue #11)が算出したシーン・ブロックのフレームから
自動的に決まるため、narration の行数を変えても追従する。

ファイルは3種それぞれ独立に存在チェックされ、置かれていないものは警告ログを出すだけで
スキップされる(レンダリングは通る)。音量はデフォルト 0.3(`src/theme.ts` の `seVolume`)。

## クレジット表記

素材のクレジットが必要な場合は、`content/{id}.json` の `credits` フィールドに書けば
`scripts/description.ts` が概要欄に自動で追記する(docs/spec.md §12 / Issue #14)。
