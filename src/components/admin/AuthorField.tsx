"use client";

import { RelationshipField, useAuth, useField, useFormFields } from "@payloadcms/ui";
import type { RelationshipFieldClientProps } from "payload";

/**
 * Ô "Người tạo" ở form sửa. Admin: ô chọn quan hệ mặc định của Payload (đổi được). Người chỉ đọc (Sale, `author.access.update = isAdmin`): ô mặc định
 * nạp tên qua `/api/staff` — bị chặn với staff khác nên chỉ hiện "Chưa đặt tên - ID" — nên hiện chữ thường từ `authorName` (BL-082). Không link sang hồ sơ staff.
 * Form tạo mới chưa có `authorName` (field ảo chỉ có khi đọc): giá trị mặc định là chính người đang đăng nhập → hiện tên họ.
 */
export function AuthorField(props: RelationshipFieldClientProps) {
  const { path, field, readOnly } = props;
  const { value } = useField<string | null>({ path });
  const authorName = useFormFields(([fields]) => fields.authorName?.value as string | null | undefined);
  const { user } = useAuth();
  if (!readOnly) return <RelationshipField {...props} />;

  const isSelf = value != null && value === user?.id;
  const name = authorName || (isSelf ? user?.fullName || user?.email : null) || "—";
  const label = typeof field.label === "string" ? field.label : "";
  return (
    <div className="field-type tami-readonly-field">
      <span className="field-label">{label}</span>
      <p className="tami-readonly-field__value">{name}</p>
    </div>
  );
}
