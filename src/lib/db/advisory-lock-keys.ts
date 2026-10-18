/**
 * Registry DUY NHẤT các id khoá advisory Postgres (`pg_advisory_xact_lock(<id>)`, phạm vi cả database): hai nghiệp vụ không liên quan
 * mà dùng chung một id sẽ chặn nhau vô cớ, và comment/doc dễ ghi sai. Thêm khoá mới = thêm một dòng ở đây với id chưa dùng.
 * (Khoá theo SĐT của `dedupeLockKey` là số 64-bit băm nên xác suất trùng các id nhỏ này không đáng kể.)
 */
export const ADVISORY_LOCK_KEYS = {
  /** Mọi thay đổi làm giảm số admin hoạt động (`last-admin-guard`). */
  adminRoster: 726_001,
  /** Ghi `redirects` khi đổi slug nội dung (`create-slug-redirect`). */
  slugRedirectWrite: 726_002,
  /** Job `data-retention`: ẩn danh/xoá dữ liệu hết hạn theo lô. */
  dataRetention: 726_003,
  /** Job `remind-unassigned-leads`: nhắc lead chưa giao. */
  remindUnassignedLeads: 726_004,
} as const;
