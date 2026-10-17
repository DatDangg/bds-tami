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
 * Phường phải thuộc tỉnh đã chọn (G22), kiểm ở server (API/seed cũng bị chặn, không chỉ `filterOptions` của admin). Chạy validator
 * `relationship` mặc định của Payload trước (nó áp `required` và `filterOptions`). `siblingData` trong `validate` đã gộp giá trị
 * đã lưu vào dữ liệu gửi lên, nên sửa riêng `province` (không gửi `ward`) cũng bị so với phường đang lưu.
 */
export const validateWardInProvince: RelationshipFieldSingleValidation = async (value, options) => {
  const base = await relationship(value, options);
  if (base !== true) return base;
  const wardId = relationId(value ?? (options.siblingData as { ward?: unknown } | undefined)?.ward);
  const provinceId = relationId((options.siblingData as ProvinceSibling)?.province);
  if (!wardId || !provinceId) return true;
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
  return relationId(ward.province) === provinceId ? true : "Phường/xã không thuộc tỉnh/thành đã chọn.";
};
