import { ROLES } from "../../access/roles";

/**
 * Luật duy nhất cho "ai được nhận lead": chỉ sale đang hoạt động. Dùng chung cho endpoint giao lead, rule trên field `assignedTo`
 * (form/REST admin, tự giao BR-12) và bước gửi email, để các đường không cho kết quả khác nhau.
 */
export function isAssignableSale(staff: { role?: string | null; active?: boolean | null } | null | undefined): boolean {
  return staff?.role === ROLES.sale && staff.active === true;
}

/** Thông báo lỗi của rule `assignedTo`; endpoint công khai (BR-12) dựa vào để fallback khi author không nhận được lead. */
export const ASSIGNEE_NOT_ASSIGNABLE_MESSAGE = "Chỉ giao được cho nhân viên sale đang hoạt động";
