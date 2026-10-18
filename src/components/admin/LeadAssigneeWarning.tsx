"use client";

import { useField } from "@payloadcms/ui";

/**
 * Cảnh báo "sale phụ trách đã bị khoá" trong form lead (field ảo `assigneeInactive`, chỉ admin nhận giá trị).
 * Không render gì khi sale còn hoạt động, chưa giao hoặc user không phải admin.
 */
export function LeadAssigneeWarning({ path }: { path: string }) {
  const { value } = useField<boolean>({ path });
  if (value !== true) return null;
  return (
    <p role="alert" className="field-description" style={{ color: "var(--theme-error-500)", fontWeight: 600 }}>
      Sale phụ trách lead này đã bị khoá. Hãy giao lại cho người khác.
    </p>
  );
}
