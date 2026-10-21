"use client";

import { useField, useFormFields } from "@payloadcms/ui";

import { describeLeadLink, summarizeLeadActivity } from "@/lib/admin/lead-contact";

interface DisplayFieldProps {
  path: string;
  field?: { label?: unknown };
}

const labelText = (field: DisplayFieldProps["field"]): string => (typeof field?.label === "string" ? field.label : "");

/** Trường dữ liệu có sẵn nhưng không cần hiện ở form (vẫn nằm trong form state, cột/bộ lọc danh sách không đổi). */
export function LeadHiddenField() {
  return null;
}

/** Link rút gọn chỉ đọc cho "Trang khách gửi form/đến từ": chỉ http(s) bấm được, mở tab mới. */
export function LeadLinkField({ path, field }: DisplayFieldProps) {
  const { value } = useField<string>({ path });
  const link = describeLeadLink(value);
  return (
    <div className="field-type tami-readonly-field">
      <span className="field-label">{labelText(field)}</span>
      {link === null ? (
        <p className="tami-readonly-field__value">—</p>
      ) : link.href ? (
        <a className="tami-readonly-field__value" href={link.href} target="_blank" rel="noopener noreferrer" title={link.href}>
          {link.label}
        </a>
      ) : (
        <p className="tami-readonly-field__value">{link.label}</p>
      )}
    </div>
  );
}

const LOCALE_LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh" };

/** Ngôn ngữ khách dùng: nhãn chữ chỉ đọc thay ô chọn bị khoá (dữ liệu/quyền/bắt buộc không đổi). */
export function LeadLocaleField({ path, field }: DisplayFieldProps) {
  const { value } = useField<string>({ path });
  return (
    <div className="field-type tami-readonly-field">
      <span className="field-label">{labelText(field)}</span>
      <p className="tami-readonly-field__value">{(typeof value === "string" && LOCALE_LABELS[value]) || "—"}</p>
    </div>
  );
}

/** Dòng tóm tắt hoạt động ở cột phải, thay 4 mốc thời gian rời. Đọc từ form state, không fetch thêm. */
export function LeadActivitySummary() {
  const lastActivityAt = useFormFields(([fields]) => fields.lastActivityAt?.value);
  const firstContactedAt = useFormFields(([fields]) => fields.firstContactedAt?.value);
  const mergedCount = useFormFields(([fields]) => fields.mergedCount?.value);
  const text = summarizeLeadActivity({ lastActivityAt, firstContactedAt, mergedCount }, new Date());
  if (!text) return null;
  return <p className="tami-field-hint tami-activity-summary">{text}</p>;
}
