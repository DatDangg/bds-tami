import { z } from "zod";

import type { ReindexScope } from "./reindex-rental-search-text";

export const REINDEX_RENTALS_SEARCH_SLUG = "reindex-rentals-search";

export const REINDEX_SCOPE_KINDS = ["province", "ward", "project"] as const;
export type ReindexScopeKind = (typeof REINDEX_SCOPE_KINDS)[number];

/** Input của job `reindex-rentals-search`: chỉ định danh (loại + id bản ghi đổi tên), không dữ liệu cá nhân; job đọc lại tin lúc chạy. */
export const reindexJobInputSchema = z.object({
  scope: z.enum(REINDEX_SCOPE_KINDS),
  id: z.string().min(1),
});
export type ReindexJobInput = z.infer<typeof reindexJobInputSchema>;

/** Phạm vi của hook (`{ provinceId }` / `{ wardId }` / `{ projectId }`) → input phẳng để lưu và truy vấn được trong `payload-jobs.input` (`input.scope`, `input.id`). */
export function toReindexJobInput(scope: Exclude<ReindexScope, "all">): ReindexJobInput {
  if ("projectId" in scope) return { scope: "project", id: scope.projectId };
  if ("wardId" in scope) return { scope: "ward", id: scope.wardId };
  return { scope: "province", id: scope.provinceId };
}

export function toReindexScope(input: ReindexJobInput): Exclude<ReindexScope, "all"> {
  if (input.scope === "project") return { projectId: input.id };
  if (input.scope === "ward") return { wardId: input.id };
  return { provinceId: input.id };
}
