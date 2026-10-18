import { JobCancelledError, type TaskConfig } from "payload";
import { z } from "zod";

import { REINDEX_RENTALS_SEARCH_SLUG, REINDEX_SCOPE_KINDS, reindexJobInputSchema, toReindexScope } from "../lib/search/reindex-job-input";
import { reindexRentalSearchText } from "../lib/search/reindex-rental-search-text";

export { REINDEX_RENTALS_SEARCH_SLUG };

/**
 * Job nền dựng lại `searchText` của các tin cho thuê thuộc một tỉnh/phường/dự án vừa đổi tên, khi số tin vượt ngưỡng làm đồng bộ trong hook
 * (`SYNC_REINDEX_LIMIT`, xem `src/lib/search/reindex-in-hook.ts`). Dùng đúng hàm của lệnh tay `pnpm reindex:rentals-search` (theo lô 100, idempotent)
 * với `req` của job (ngoài transaction của lần lưu admin), nên chạy lại hay chạy chồng đều cho cùng kết quả.
 * Lỗi DB tạm thời → ném để Payload thử lại 3 lần (backoff mũ từ 60s); input sai → `JobCancelledError` (không thử lại). Log chỉ có định danh + số lượng.
 */
export const reindexRentalsSearchTask: TaskConfig<"reindex-rentals-search"> = {
  slug: REINDEX_RENTALS_SEARCH_SLUG,
  label: "Dựng lại chỉ mục tìm kiếm tin cho thuê (đổi tên tỉnh/phường/dự án)",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 60_000 } },
  inputSchema: [
    { name: "scope", type: "select", required: true, options: [...REINDEX_SCOPE_KINDS] },
    { name: "id", type: "text", required: true },
  ],
  outputSchema: [
    { name: "rentals", type: "number", required: true },
    { name: "rows", type: "number", required: true },
  ],
  handler: async ({ input, job, req }) => {
    const logger = req.payload.logger;
    const parsed = reindexJobInputSchema.safeParse(input);
    if (!parsed.success) {
      logger.error({ jobId: job.id, errorName: z.ZodError.name }, "Reindex searchText: input job không hợp lệ, huỷ job không thử lại");
      throw new JobCancelledError("Input job reindex không hợp lệ");
    }
    const { scope, id } = parsed.data;
    try {
      const outcome = await reindexRentalSearchText(req.payload, toReindexScope(parsed.data), req);
      logger.info({ jobId: job.id, scope, id, ...outcome }, "Reindex searchText: xong job nền");
      return { output: outcome };
    } catch (error) {
      // Log mặc định của Payload bị runner tắt (silent.error); ghi định danh + tên lỗi, không message (có thể chứa SQL/dữ liệu).
      logger.error({ jobId: job.id, scope, id, errorName: error instanceof Error ? error.name : "UnknownError" }, "Reindex searchText: job nền thất bại, sẽ thử lại theo backoff");
      throw error;
    }
  },
};
