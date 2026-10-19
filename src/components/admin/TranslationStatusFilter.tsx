"use client";

import { SelectInput, useListQuery } from "@payloadcms/ui";
import type { OptionObject, Where } from "payload";

import { currentTranslationFilter, TRANSLATION_FILTER_KEYS, TRANSLATION_FILTERS, type TranslationFilterKey, withTranslationFilter } from "@/lib/translation/admin-ui";

const FILTER_OPTIONS: OptionObject[] = TRANSLATION_FILTER_KEYS.map((key) => ({ label: TRANSLATION_FILTERS[key].label, value: key }));

/**
 * Giá trị react-select (1 lựa chọn, hoặc null khi bấm xoá) → khoá lọc dịch; "" = bỏ lọc.
 * Khoá lạ cũng về "" để không ghi điều kiện sai vào `where`.
 */
export function translationFilterFromSelection(selection: unknown): TranslationFilterKey | "" {
  const option = Array.isArray(selection) ? selection[0] : selection;
  const value = option && typeof option === "object" && "value" in option ? (option as { value: unknown }).value : "";
  return TRANSLATION_FILTER_KEYS.find((key) => key === value) ?? "";
}

/**
 * Lọc danh sách nội dung theo trạng thái dịch (FR-ADM-18): chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đổi sau khi sửa tay.
 * Dùng `SelectInput` của Payload (react-select) cho đồng bộ ô lọc cạnh đó; giữ nguyên các bộ lọc khác và đổi về trang 1.
 */
export function TranslationStatusFilter() {
  const { query, refineListData } = useListQuery();
  const where = query?.where as Where | undefined;
  const current = currentTranslationFilter(where);

  return (
    <div className="list-toolbar-item translation-status-filter">
      {/* Không dùng prop `label` của SelectInput: FieldLabel htmlFor trỏ vào div wrapper, không phải input react-select. Bọc <label> để combobox có tên truy cập. */}
      <label className="field-label">
        Trạng thái dịch
        <SelectInput
          className="translation-status-filter__select"
          isClearable
          name="translation-status-filter"
          onChange={(selection) => void refineListData({ where: withTranslationFilter(where, translationFilterFromSelection(selection)), page: 1 })}
          options={FILTER_OPTIONS}
          path="translation-status-filter"
          placeholder="Tất cả"
          value={current}
        />
      </label>
    </div>
  );
}
