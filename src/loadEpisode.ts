import { z } from "zod";
import { episodeSchema, type Episode } from "./schema";

// content/*.json を episodeSchema で検証する。schema 違反があれば理由が分かるエラーで落とす。
export const loadEpisode = (data: unknown): Episode => {
  const result = episodeSchema.safeParse(data);
  if (!result.success) {
    const details = z.prettifyError(result.error);
    throw new Error(`episodeSchema の検証に失敗したのだ:\n${details}`);
  }
  return result.data;
};
