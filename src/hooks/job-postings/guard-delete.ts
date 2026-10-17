import { APIError, type CollectionBeforeDeleteHook } from "payload";

/**
 * Chặn xoá HẲN (chỉ admin) tin tuyển dụng còn hồ sơ ứng tuyển. `job_applications.job_posting_id` là NOT NULL còn FK là
 * `ON DELETE SET NULL`, nên nếu cứ xoá thì Postgres báo lỗi ràng buộc (500 khó hiểu). Xoá mềm không đi qua hook này và vẫn
 * được: hồ sơ giữ nguyên, tin chỉ biến mất khỏi trang công khai. Hồ sơ hết hạn lưu được job `data-retention` dọn (ERD §7).
 */
export const guardJobPostingHardDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const applications = await req.payload.find({
    collection: "job-applications",
    where: { jobPosting: { equals: id } },
    depth: 0,
    limit: 1,
    pagination: false,
    select: { jobPosting: true },
    overrideAccess: true,
    req,
  });
  if (applications.docs.length > 0) {
    throw new APIError("Không xoá hẳn được tin tuyển dụng đang có hồ sơ ứng tuyển. Hãy ẩn hoặc xoá mềm tin này.", 409, undefined, true);
  }
};
