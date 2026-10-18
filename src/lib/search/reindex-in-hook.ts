import type { PayloadRequest } from "payload";

import { REINDEX_RENTALS_SEARCH_SLUG, type ReindexJobInput, toReindexJobInput } from "./reindex-job-input";
import { type ReindexOutcome, type ReindexScope, reindexRentalSearchText, rentalsInScope } from "./reindex-rental-search-text";

/**
 * Số tin tối đa mà hook lưu (tỉnh/phường/dự án) dựng lại `searchText` ĐỒNG BỘ trong transaction của lần lưu admin. Mỗi tin ghi vài dòng
 * (mỗi ngôn ngữ một lần), nên vài trăm tin vẫn là một lần lưu chấp nhận được; nhiều hơn sẽ giữ transaction và request admin quá lâu.
 */
export const SYNC_REINDEX_LIMIT = 500;

/** Job reindex của CHÍNH phạm vi này đã xếp nhưng chưa chạy (chưa lấy, chưa lỗi cuối): lần lưu mới không cần xếp thêm, job sẽ đọc tên mới nhất lúc chạy. */
async function findPendingReindexJob(req: PayloadRequest, input: ReindexJobInput): Promise<{ id: string | number } | undefined> {
  const found = await req.payload.find({
    collection: "payload-jobs",
    where: {
      and: [
        { taskSlug: { equals: REINDEX_RENTALS_SEARCH_SLUG } },
        { completedAt: { exists: false } },
        { processing: { not_equals: true } },
        { hasError: { not_equals: true } },
        { "input.scope": { equals: input.scope } },
        { "input.id": { equals: input.id } },
      ],
    },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  return found.docs[0];
}

/**
 * Xếp job `reindex-rentals-search` bằng `req` GỐC, tức trong transaction của lần lưu: job chỉ hiện với process `jobs` sau khi lần lưu commit
 * (không chạy với tên cũ), lần lưu rollback thì không để lại job. Đánh đổi: lỗi khi xếp job (vd enum `task_slug` chưa migrate) làm hỏng cả lần lưu —
 * chấp nhận, vì migration thêm giá trị enum đi cùng code và lỗi lộ ra ngay thay vì âm thầm mất lần dựng lại. Export để integration test gọi thẳng (ngưỡng 500 không hạ được).
 */
export async function queueReindexJob(req: PayloadRequest, scope: Exclude<ReindexScope, "all">): Promise<string | number> {
  const input = toReindexJobInput(scope);
  const pending = await findPendingReindexJob(req, input);
  if (pending) return pending.id;
  const job = await req.payload.jobs.queue({ task: REINDEX_RENTALS_SEARCH_SLUG, input, req });
  return job.id;
}

/**
 * Dựng lại `searchText` cho các tin thuộc `scope` từ một hook admin. Tin trong phạm vi ≤ `SYNC_REINDEX_LIMIT`: làm đồng bộ trong transaction của lần lưu
 * (tìm được ngay sau khi lưu). Vượt ngưỡng: xếp MỘT job nền `reindex-rentals-search` (idempotent theo phạm vi: đã có job chờ thì dùng lại) và trả `"queued"`;
 * form admin của bản ghi hiện cảnh báo tới khi job xong (`searchReindexPendingField`). Lệnh tay `pnpm reindex:rentals-search` vẫn dùng được để bù.
 */
export async function reindexRentalsFromHook(req: PayloadRequest, scope: Exclude<ReindexScope, "all">, source: string): Promise<ReindexOutcome | "queued"> {
  const total = await rentalsInScope(req.payload, scope, req);
  if (total > SYNC_REINDEX_LIMIT) {
    const jobId = await queueReindexJob(req, scope);
    req.payload.logger.info({ source, ...toReindexJobInput(scope), rentals: total, limit: SYNC_REINDEX_LIMIT, jobId }, "Số tin cần dựng lại searchText vượt ngưỡng đồng bộ: xếp job nền reindex-rentals-search");
    return "queued";
  }
  return reindexRentalSearchText(req.payload, scope, req);
}
