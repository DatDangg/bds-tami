/** Giá trị cố định của lead và lịch sử chăm sóc (ERD §4.11). Nguồn duy nhất cho select, hook và test. */
export const LEAD_SOURCES = ["rental", "property_post", "project", "contact"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** BR-11: Mới → Đã liên hệ → Đang tư vấn → Đã chốt | Không thành (bắt buộc lý do) | Spam. */
export const LEAD_STATUSES = ["new", "contacted", "consulting", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_ACTIVITY_TYPES = ["note", "call", "status_change", "assignment", "merged", "email_sent"] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

/** Loại hoạt động người dùng được thêm tay qua API/admin. Các loại còn lại chỉ hệ thống ghi (Local API), không ai giả mạo được lịch sử. */
export const MANUAL_ACTIVITY_TYPES: readonly LeadActivityType[] = ["note", "call"];

export const LEAD_LOCALES = ["vi", "en"] as const;

/**
 * Giá trị thay thế khi ẩn danh (hết hạn lưu 24 tháng, ERD §7). Các cột PII còn lại (`email`, `message`) cho phép NULL nên
 * đặt NULL; `fullName`, `phone`, `phoneNormalized` là NOT NULL nên dùng chuỗi này. `job-applications` dùng cùng giá trị (G23).
 */
export const ANONYMIZED_PLACEHOLDER = "Đã ẩn danh";
