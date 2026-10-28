import type { Access, Where } from "payload";

/** Trạng thái khách được thấy (ERD §1). Rentals thêm `rented`. */
export const PUBLIC_STATUSES = {
  default: ["published"],
  rentals: ["published", "rented"],
} as const;

export interface PublicWhereOptions {
  /**
   * Hẹn giờ xuất bản (FR-ADM-16, BL-091): chỉ Tin tức bật. Thêm `publishedAt` trống hoặc ≤ `now`: bài `published` có `publishedAt`
   * ở tương lai chưa hiện với khách. Không bật = điều kiện y hệt cũ (Dự án / Cho thuê / Tin BĐS / Tuyển dụng không đổi).
   */
  scheduled?: boolean;
  /** Mốc "bây giờ" (test truyền được); mặc định `new Date()` lúc gọi, tức mỗi request. */
  now?: Date;
}

/**
 * Điều kiện "công khai" dùng chung cho khách: trạng thái công khai + chưa xoá mềm; collection có hẹn giờ (chỉ `news`) thêm
 * `publishedAt` trống / ≤ now qua `options.scheduled`. Mọi tiêu chí hiển thị công khai thêm ở ĐÂY.
 */
export function buildPublicWhere(statuses: readonly string[], options: PublicWhereOptions = {}): Where {
  const and: Where[] = [{ status: { in: [...statuses] } }, { deletedAt: { exists: false } }];
  if (options.scheduled) {
    const now = options.now ?? new Date();
    and.push({ or: [{ publishedAt: { exists: false } }, { publishedAt: { less_than_equal: now.toISOString() } }] });
  }
  return { and };
}

/** Staff đang hoạt động thấy tất cả; khách chỉ thấy bản ghi công khai; tài khoản khoá: không gì cả. */
export function makePublishedOnly(statuses: readonly string[], options: PublicWhereOptions = {}): Access {
  return ({ req: { user } }) => {
    if (!user) return buildPublicWhere(statuses, options);
    return user.active === true;
  };
}

export const publishedOnly = makePublishedOnly(PUBLIC_STATUSES.default);
export const rentalsPublishedOnly = makePublishedOnly(PUBLIC_STATUSES.rentals);
