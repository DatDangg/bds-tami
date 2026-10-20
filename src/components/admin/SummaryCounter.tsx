"use client";

import { useField } from "@payloadcms/ui";

import { describeSummaryLength } from "@/lib/admin/form-hints";

/** Bộ đếm dưới ô Mô tả ngắn/Tóm tắt: "123 ký tự · nên 150–200". Chỉ nhắc, không chặn lưu (BL-042). */
export function SummaryCounter({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  const hint = describeSummaryLength(value);
  return (
    <p className={`tami-field-hint${hint.outOfRange ? " tami-field-hint--warn" : ""}`} aria-live="polite">
      {hint.text}
    </p>
  );
}
