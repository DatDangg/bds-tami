import type { Access, Where } from "payload";

/** Trạng thái khách được thấy (ERD §1). Rentals thêm `rented`. */
export const PUBLIC_STATUSES = {
  default: ["published"],
  rentals: ["published", "rented"],
} as const;

/**
 * Điều kiện "công khai" dùng chung cho khách. Mọi tiêu chí hiển thị công khai
 * (kể cả hẹn giờ `publishedAt <= now`, FR-ADM-16) chỉ thêm ở ĐÂY.
 */
export function buildPublicWhere(statuses: readonly string[]): Where {
  return {
    and: [{ status: { in: [...statuses] } }, { deletedAt: { exists: false } }],
  };
}

/** Staff đang hoạt động thấy tất cả; khách chỉ thấy bản ghi công khai; tài khoản khoá: không gì cả. */
export function makePublishedOnly(statuses: readonly string[]): Access {
  return ({ req: { user } }) => {
    if (!user) return buildPublicWhere(statuses);
    return user.active === true;
  };
}

export const publishedOnly = makePublishedOnly(PUBLIC_STATUSES.default);
export const rentalsPublishedOnly = makePublishedOnly(PUBLIC_STATUSES.rentals);
