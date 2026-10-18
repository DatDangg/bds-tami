import type { PayloadRequest } from "payload";

import { type ReindexOutcome, type ReindexScope, reindexRentalSearchText, rentalsInScope } from "./reindex-rental-search-text";

/**
 * Số tin tối đa mà hook lưu (tỉnh/phường/dự án) dựng lại `searchText` ĐỒNG BỘ trong transaction của lần lưu admin. Mỗi tin ghi vài dòng
 * (mỗi ngôn ngữ một lần), nên vài trăm tin vẫn là một lần lưu chấp nhận được; nhiều hơn sẽ giữ transaction và request admin quá lâu.
 */
export const SYNC_REINDEX_LIMIT = 500;

/**
 * Dựng lại `searchText` cho các tin thuộc `scope` từ một hook admin. Tin trong phạm vi vượt `SYNC_REINDEX_LIMIT` thì KHÔNG làm trong transaction:
 * ghi log lỗi chỉ lệnh bù (`pnpm reindex:rentals-search`) và trả `"deferred"` (việc lưu tỉnh/phường/dự án vẫn thành công).
 *
 * Còn thiếu: đẩy phần vượt ngưỡng sang job nền (Payload Jobs) để tự động hoá bước bù. Job mới cần thêm giá trị vào enum `task_slug` của
 * `payload_jobs` (migration), ngoài phạm vi layer-8-task-03: xem follow-up của task.
 */
export async function reindexRentalsFromHook(req: PayloadRequest, scope: Exclude<ReindexScope, "all">, source: string): Promise<ReindexOutcome | "deferred"> {
  const total = await rentalsInScope(req.payload, scope, req);
  if (total > SYNC_REINDEX_LIMIT) {
    req.payload.logger.error(
      { source, scope, rentals: total, limit: SYNC_REINDEX_LIMIT },
      "Số tin cần dựng lại searchText vượt ngưỡng đồng bộ: bỏ qua trong lần lưu này, hãy chạy `pnpm reindex:rentals-search`",
    );
    return "deferred";
  }
  return reindexRentalSearchText(req.payload, scope, req);
}
