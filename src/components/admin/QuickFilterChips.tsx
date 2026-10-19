"use client";

import { useListDrawerContext, useListQuery } from "@payloadcms/ui";
import type { Where } from "payload";

import { currentChip, hasGroupCondition, type QuickFilterGroup, withChip } from "@/lib/admin/quick-filters";

/**
 * Thanh chip lọc nhanh trên danh sách (BL-022): mỗi nhóm chọn 1, bấm lại chip đang sáng hoặc `Tất cả` = bỏ lọc nhóm.
 * Ghi vào `where` của URL qua `refineListData` (giữ bộ lọc / Lọc dịch khác, về trang 1). Ẩn trong list drawer: `where` của drawer là cục bộ
 * và không phản ánh `filterOptions`, nên chip dễ gây hiểu nhầm.
 */
export function QuickFilterChips({ groups }: { groups: QuickFilterGroup[] }) {
  const { query, refineListData } = useListQuery();
  const { isInDrawer } = useListDrawerContext();
  if (isInDrawer) return null;
  const where = query?.where as Where | undefined;

  return (
    <div className="list-toolbar-item quick-filter-chips">
      {groups.map((group) => {
        const active = currentChip(where, group);
        // `Tất cả` sáng khi nhóm không có điều kiện nào (kể cả bộ lọc tay không khớp chip); bấm khi đang sáng thì không gọi refineListData.
        const allActive = active === "" && !hasGroupCondition(where, group);
        const choose = (key: string) => void refineListData({ where: withChip(where, group, key), page: 1 });
        return (
          <div aria-label={group.label} className="quick-filter-chips__group" key={group.id} role="group">
            <span aria-hidden="true" className="quick-filter-chips__label">
              {group.label}
            </span>
            <div className="quick-filter-chips__scroller">
              {group.allLabel ? (
                <button aria-pressed={allActive} className="quick-filter-chips__chip" onClick={() => (allActive ? undefined : choose(""))} type="button">
                  {group.allLabel}
                </button>
              ) : null}
              {group.chips.map((chip) => (
                <button aria-pressed={active === chip.key} className="quick-filter-chips__chip" key={chip.key} onClick={() => choose(active === chip.key ? "" : chip.key)} type="button">
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
