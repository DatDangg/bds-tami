"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import type { NearbyGroupView } from "@/lib/projects/project-detail-view";
import { cn } from "@/lib/utils";

const TAB_BASE =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill px-4 text-small font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function NearbyList({ group, label }: { group: NearbyGroupView; label: string }) {
  return (
    <ul aria-label={label} className="grid gap-x-8 sm:grid-cols-2">
      {group.items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
          <span className="min-w-0 break-words">{item.name}</span>
          {item.distance && <span className="shrink-0 text-small font-semibold text-text-secondary">{item.distance}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Tiện ích quanh dự án theo nhóm (tab viên thuốc, chỉ các nhóm có dòng). HTML server render ĐỦ mọi panel (panel không chọn chỉ có `hidden`) nên khi chưa có JS tab đầu đọc được.
 * Một nhóm duy nhất thì không dựng tablist (không có gì để chọn). Bàn phím theo mẫu ARIA tabs: ←/→ (vòng), Home/End, roving tabindex, chuyển tab là kích hoạt.
 */
export function NearbyTabs({ groups }: { groups: NearbyGroupView[] }) {
  const t = useTranslations("page.projectDetail.nearby");
  const uid = useId();
  const [activeCategory, setActiveCategory] = useState(groups[0]?.category ?? "other");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasTabs = groups.length > 1;
  const tabId = (category: string) => `${uid}-tab-${category}`;
  const panelId = (category: string) => `${uid}-panel-${category}`;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = groups.length - 1;
    const index = Math.max(0, groups.findIndex((group) => group.category === activeCategory));
    const nextIndex = { ArrowRight: (index + 1) % groups.length, ArrowLeft: (index + last) % groups.length, Home: 0, End: last }[event.key];
    const next = nextIndex === undefined ? undefined : groups[nextIndex];
    if (!next) return;
    event.preventDefault();
    setActiveCategory(next.category);
    tabRefs.current[next.category]?.focus();
  };

  return (
    <div>
      <h3 className="mb-4 font-display text-h3">{t("title")}</h3>
      {hasTabs && (
        <div role="tablist" aria-label={t("tabs")} className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {groups.map((group) => (
            <button
              key={group.category}
              ref={(node) => {
                tabRefs.current[group.category] = node;
              }}
              type="button"
              role="tab"
              id={tabId(group.category)}
              aria-selected={activeCategory === group.category}
              aria-controls={panelId(group.category)}
              tabIndex={activeCategory === group.category ? 0 : -1}
              onClick={() => setActiveCategory(group.category)}
              onKeyDown={onTabKeyDown}
              className={cn(TAB_BASE, "shrink-0 whitespace-nowrap", activeCategory === group.category ? "bg-dark text-on-dark" : "border border-border text-text hover:border-text hover:bg-surface-muted")}
            >
              {t(`categories.${group.category}`)}
            </button>
          ))}
        </div>
      )}
      {groups.map((group) => (
        <div
          key={group.category}
          role={hasTabs ? "tabpanel" : undefined}
          id={panelId(group.category)}
          aria-labelledby={hasTabs ? tabId(group.category) : undefined}
          tabIndex={hasTabs ? 0 : undefined}
          hidden={hasTabs && activeCategory !== group.category}
        >
          <NearbyList group={group} label={t(`categories.${group.category}`)} />
        </div>
      ))}
    </div>
  );
}
