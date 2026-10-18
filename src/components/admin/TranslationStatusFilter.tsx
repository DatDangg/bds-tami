"use client";

import { useListQuery } from "@payloadcms/ui";
import type { Where } from "payload";

import { currentTranslationFilter, TRANSLATION_FILTER_KEYS, TRANSLATION_FILTERS, type TranslationFilterKey, withTranslationFilter } from "@/lib/translation/admin-ui";

/**
 * Lọc danh sách nội dung theo trạng thái dịch (FR-ADM-18): chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đổi sau khi sửa tay.
 * Dùng điều kiện trên trường có sẵn của nhóm `translation`, giữ nguyên các bộ lọc khác của danh sách và đổi về trang 1.
 */
export function TranslationStatusFilter() {
  const { query, refineListData } = useListQuery();
  const where = query?.where as Where | undefined;
  const current = currentTranslationFilter(where);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      <label htmlFor="translation-status-filter" className="field-label" style={{ margin: 0 }}>
        Trạng thái dịch
      </label>
      <select
        id="translation-status-filter"
        value={current}
        style={{ minHeight: 44, minWidth: 220 }}
        onChange={(event) => void refineListData({ where: withTranslationFilter(where, event.target.value as TranslationFilterKey | ""), page: 1 })}
      >
        <option value="">Tất cả</option>
        {TRANSLATION_FILTER_KEYS.map((key) => (
          <option key={key} value={key}>
            {TRANSLATION_FILTERS[key].label}
          </option>
        ))}
      </select>
    </div>
  );
}
