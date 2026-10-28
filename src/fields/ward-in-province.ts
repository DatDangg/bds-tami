import type { RelationshipFieldSingleValidation, Where } from "payload";
import { relationship } from "payload/shared";

import { relationId } from "../lib/payload/relation-id";

type ProvinceSibling = { province?: unknown } | undefined;

/**
 * Lọc phường theo tỉnh đã chọn (G22) cho ô chọn trong admin. `siblingData` ở đây là dữ liệu form, nên chưa chọn tỉnh thì chưa lọc.
 */
export function wardFilterOptions({ siblingData }: { siblingData?: unknown }): Where | true {
  const provinceId = relationId((siblingData as ProvinceSibling)?.province);
  return provinceId ? { province: { equals: provinceId } } : true;
}

/**
 * Phường phải thuộc tỉnh đã chọn (G22), kiểm ở server (API/seed cũng bị chặn, không chỉ `filterOptions` của admin). Kiểm thuộc tỉnh
 * TRƯỚC validator `relationship` mặc định: validator đó áp `filterOptions` đã lọc theo tỉnh và trả câu có UUID ("lựa chọn không hợp lệ:
 * <id>") thay vì câu tiếng Việt dưới đây; rồi mới chạy nó cho phần còn lại (`required`, …). `siblingData` trong `validate` đã gộp giá trị
 * đã lưu vào dữ liệu gửi lên, nên sửa riêng `province` (không gửi `ward`) cũng bị so với phường đang lưu.
 */
export const validateWardInProvince: RelationshipFieldSingleValidation = async (value, options) => {
  const wardId = relationId(value ?? (options.siblingData as { ward?: unknown } | undefined)?.ward);
  const provinceId = relationId((options.siblingData as ProvinceSibling)?.province);
  if (wardId && provinceId) {
    const ward = await options.req.payload.findByID({
      collection: "wards",
      id: wardId,
      depth: 0,
      select: { province: true },
      overrideAccess: true,
      disableErrors: true,
      req: options.req,
    });
    if (!ward) return "Phường/xã không tồn tại.";
    if (relationId(ward.province) !== provinceId) return "Phường/xã không thuộc tỉnh/thành đã chọn.";
  }
  return relationship(value, options);
};

/**
 * Như `validateWardInProvince` cho collection mà `province` và `ward` đều TUỲ CHỌN (đăng tin BĐS): phường không có tỉnh thì không lọc/so
 * được, nên chọn phường mà thiếu tỉnh là lỗi (`siblingData` đã gộp giá trị đã lưu: xoá riêng `province` khi còn `ward` cũng bị chặn).
 */
export const validateWardWithOptionalProvince: RelationshipFieldSingleValidation = async (value, options) => {
  const wardId = relationId(value ?? (options.siblingData as { ward?: unknown } | undefined)?.ward);
  const provinceId = relationId((options.siblingData as ProvinceSibling)?.province);
  // Kiểm thiếu tỉnh TRƯỚC: validator mặc định (trong validateWardInProvince) trả câu có id nếu phường không hợp lệ.
  if (wardId && !provinceId) return "Chọn tỉnh/thành trước khi chọn phường/xã.";
  return validateWardInProvince(value, options);
};

/** Ô Phường/xã dùng chung: lọc theo tỉnh ngay ở client + bỏ chọn khi đổi tỉnh (`WardField`); `filterOptions` server giữ cho form-state/API. */
export const WARD_FIELD_COMPONENT = "/components/admin/WardField#WardField";
