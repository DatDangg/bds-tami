"use client";

import { useFormFields } from "@payloadcms/ui";

import { translationSummary } from "@/lib/translation/admin-ui";

/** Đọc từng giá trị riêng (kiểu nguyên thuỷ) để chỉ vẽ lại khi chính trường đó đổi, không vẽ lại theo mọi lần gõ trong form. */
const useTranslationField = (name: string) => useFormFields(([fields]) => fields[`translation.${name}`]?.value);

/**
 * Dòng tóm tắt trạng thái bản tiếng Anh trong nhóm "Bản dịch" (BL-042). Đọc các trường hệ thống `translation.*` (đã `admin.hidden` nhưng vẫn nằm
 * trong form state) nên người dùng không phải đọc 7 ô kỹ thuật. Chỉ hiển thị, không ghi dữ liệu.
 */
export function TranslationSummary() {
  const summary = translationSummary({
    status: useTranslationField("status"),
    enSource: useTranslationField("enSource"),
    translatedAt: useTranslationField("translatedAt"),
    viChangedAfterManual: useTranslationField("viChangedAfterManual"),
    lastError: useTranslationField("lastError"),
  });
  return (
    <div className="tami-translation-summary">
      <p className="tami-translation-summary__text">{summary.text}</p>
      {summary.warning ? (
        <p role="status" className="field-description tami-translation-summary__warning">
          {summary.warning}
        </p>
      ) : null}
    </div>
  );
}
