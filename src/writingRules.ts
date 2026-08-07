// docs/spec.md §4.3 の執筆規約のうち、機械的に拾えるものだけを検査する(Issue #53)。
// 文体そのもの(抽象表現・言い訳の先回り否定の有無など)は lint で縛らない。過剰になるため
// 規約の記述に留め、ここでは「読めば誰でも同じ判定になるもの」だけを見る。
//
// 判定結果は警告として扱う(scripts/validate.ts は exit 1 しない)。ep01〜ep03 は
// 作り直さない方針(docs/spec.md §4.3)で、`pnpm run build:episode ep01` を
// 通り続けさせる必要があるため。

import type { Episode } from "./schema";
import { prohibitValue } from "./switchable";

// docs/spec.md §4.3 R6
export const HOOK_NARRATION_MAX_CHARS = 30;
export const ITEM_NARRATION_MIN_CHARS = 145;

// 「1つ目」「２つ目」「一つ目」いずれも拾う(docs/spec.md §4.3 R1)
const ORDINAL_HEAD = /^[0-9０-９一二三四五六七八九]+\s*つ目/;

// 重複判定の前に、句読点・鉤括弧・空白といった「同じことを言っているかに関係しない」文字を落とす。
// 見出しが「爪が伸びっぱなし」で1行目が「爪が、伸びっぱなしなのだ」でも重複として拾えるようにする
const normalize = (text: string): string => text.replace(/[\s、。，．・「」『』"'”“()（）!！?？…—-]/g, "");

// 字数は句読点込みで数える(docs/spec.md §4.3 R6 の目安がその数え方で出ているため)
const charCount = (lines: string[]): number => lines.join("").length;

const sentenceCount = (lines: string[]): number =>
  lines.join("").split(/[。!！?？]/).filter((part) => part.trim().length > 0).length;

export type RuleViolation = {
  rule: string; // "R1" | "R6"
  field: string; // "items[1].narration[0]" のような場所
  message: string; // 何がまずいか
  hint: string; // どう直すか(docs/spec.md の該当ルールの言い換え)
};

// docs/spec.md §4.3 R1: narration の1行目から中身に入る
const checkItemOpening = (episode: Episode): RuleViolation[] => {
  const violations: RuleViolation[] = [];

  for (const item of episode.items) {
    const first = item.narration[0];
    if (!first) {
      continue;
    }
    const field = `items[${item.no}].narration[0]`;

    if (ORDINAL_HEAD.test(first.trim())) {
      violations.push({
        rule: "R1",
        field,
        message: `narration の1行目が「Nつ目」で始まっているのだ: "${first}"`,
        hint: "項目番号は画面左上の 01/02/03 カードが出しているのだ。1行目から中身に入るのだ",
      });
    }

    const headline = normalize(prohibitValue(item.headline));
    if (headline.length > 0 && normalize(first).includes(headline)) {
      violations.push({
        rule: "R1",
        field,
        message:
          `narration の1行目が見出し「${prohibitValue(item.headline)}」をそのまま読み上げているのだ: "${first}"`,
        hint: "見出しは画面に出ているのだ。1行目には画面に無い情報(具体的な情景)を置くのだ",
      });
    }
  }

  return violations;
};

// docs/spec.md §4.3 R6: 字数の目安
const checkLength = (episode: Episode): RuleViolation[] => {
  const violations: RuleViolation[] = [];

  const hookChars = charCount(episode.hookNarration);
  if (hookChars > HOOK_NARRATION_MAX_CHARS) {
    violations.push({
      rule: "R6",
      field: "hookNarration",
      message: `hookNarration が ${hookChars}字なのだ(上限 ${HOOK_NARRATION_MAX_CHARS}字)`,
      hint: "冒頭で離脱させないのだ。内容は画面の hook が既に出しているのだ",
    });
  }

  const hookSentences = sentenceCount(episode.hookNarration);
  if (hookSentences > 1) {
    violations.push({
      rule: "R6",
      field: "hookNarration",
      message: `hookNarration が ${hookSentences}文なのだ(1文にするのだ)`,
      hint: "掴みは1文で言い切るのだ。2文目に置きたい内容は item に回すのだ",
    });
  }

  for (const item of episode.items) {
    const chars = charCount(item.narration);
    if (chars < ITEM_NARRATION_MIN_CHARS) {
      violations.push({
        rule: "R6",
        field: `items[${item.no}].narration`,
        message: `narration が ${chars}字なのだ(下限 ${ITEM_NARRATION_MIN_CHARS}字)`,
        hint: "宣告 / 理由 / 刺す / 行動 の4行を全部書き切れていないのだ。抜けている要素を足すのだ",
      });
    }
  }

  return violations;
};

export const checkWritingRules = (episode: Episode): RuleViolation[] => [
  ...checkItemOpening(episode),
  ...checkLength(episode),
];

export const formatViolation = (violation: RuleViolation): string =>
  `[${violation.rule}] ${violation.field}: ${violation.message}\n  → ${violation.hint}`;
