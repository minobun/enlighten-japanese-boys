import { z } from "zod";

// Phase 1 プレースホルダ。フィールドの実装は該当 Issue で行う(docs/spec.md §4.1)。
export const episodeSchema = z.object({});

export type Episode = z.infer<typeof episodeSchema>;
