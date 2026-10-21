"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { MapPin } from "@/components/icons";
import { DetailExpandButton } from "./DetailExpandButton";

export interface DetailDistance {
  /** Icon nhóm địa điểm đã dựng; trống → ghim bản đồ. */
  icon?: ReactNode;
  name: string;
  /** Chip khoảng cách đã định dạng ("5 phút", "1,2 km"); trống → không chip (vẫn hiện tên). */
  distance?: string | null;
}

/** Hiện tối đa ngần này hàng trước nút "Xem thêm". */
const INITIAL = 8;

/**
 * Danh sách "Khoảng cách đến các địa điểm quan trọng" (BL-052, khối Vị trí): icon + tên + chip khoảng cách canh phải; > 8 hàng → nút "Xem thêm" (`aria-expanded`).
 * `title` tuỳ chọn dựng `h3` và đặt tên cho danh sách. Rỗng → không dựng.
 */
export function DetailDistanceList({ items, title }: { items: DetailDistance[]; title?: string }) {
  const t = useTranslations("detailKit.expand");
  const listId = useId();
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const collapsible = items.length > INITIAL;

  return (
    <div>
      {title && (
        <h3 id={headingId} className="mb-3 text-small font-semibold text-text">
          {title}
        </h3>
      )}
      <ul id={listId} {...(title ? { "aria-labelledby": headingId } : {})} className="divide-y divide-border">
        {items.map((item, position) => (
          <li key={`${item.name}-${position}`} hidden={collapsible && !expanded && position >= INITIAL} className="flex items-center gap-3 py-2.5">
            <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-accent-text">
              {item.icon ?? <MapPin size={16} />}
            </span>
            <span className="min-w-0 flex-1 text-small break-words text-text">{item.name}</span>
            {item.distance && <span className="shrink-0 rounded-pill bg-primary-subtle px-3 py-1 text-xsmall font-semibold text-accent-text tabular-nums">{item.distance}</span>}
          </li>
        ))}
      </ul>
      {collapsible && (
        <div className="mt-2">
          <DetailExpandButton expanded={expanded} onToggle={() => setExpanded((value) => !value)} controls={listId} moreLabel={t("showMore")} lessLabel={t("showLess")} />
        </div>
      )}
    </div>
  );
}
