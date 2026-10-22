/**
 * Nguồn duy nhất của danh sách hành động audit (ERD §4.13). Collection `audit-logs` dùng danh sách này
 * làm options của select, nên thêm hành động mới = sửa ở đây rồi tạo migration (enum Postgres).
 */
export const AUDIT_ACTIONS = [
  "lead.assign",
  "lead.export",
  "content.delete",
  "content.restore",
  "content.purge",
  "staff.create",
  "staff.reset_password",
  "staff.update_role",
  "staff.deactivate",
  // Hai hành động dưới đây ngoài danh sách gốc của ERD: mở lại tài khoản và xoá tài khoản là thao tác
  // quản trị tài khoản nhạy cảm không kém khoá/đổi vai trò, không thể để không có dấu vết.
  "staff.activate",
  "staff.delete",
  "auth.login_failed",
  "application.view_cv",
  "content.retranslate",
  "content.approve_translation",
  // Job `data-retention` (hệ thống, không actor) vừa ẩn danh/xoá dữ liệu hết hạn; meta chỉ có số lượng, không PII.
  "system.data_retention",
  // BL-054: xuất danh sách email đăng ký bản tin (dữ liệu cá nhân) ra Excel; meta chỉ có bộ lọc + số dòng.
  "newsletter.export",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
