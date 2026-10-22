"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { CheckCircle } from "@/components/icons";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";
import { DetailExpandButton } from "./DetailExpandButton";

export interface DetailFeature {
  /** Icon Phosphor đã dựng; trống → dấu tích. */
  icon?: ReactNode;
  title: string;
  description?: string | null;
}

interface DetailFeatureListProps {
  items: DetailFeature[];
  /** Số mục hiện lúc đầu; phần còn lại mở bằng nút. */
  initialCount?: number;
  /** Nhãn nút mở (vd "Khám phá tất cả tiện ích"); mặc định "Xem tất cả". */
  expandLabel?: string;
  /** Ảnh lớn bên trái (≥ md); trống → danh sách rộng hết. */
  image?: MediaImage | null;
}

/**
 * Danh sách tính năng có icon (BL-052, khối "Tiện ích nổi bật"): icon tròn + tên + mô tả; hiện `initialCount` mục đầu, nút (`aria-expanded`) mở / thu phần còn lại.
 * Có `image` → ≥ md ảnh lớn bên trái, danh sách bên phải; không có → danh sách rộng hết, 2 cột ≥ sm, 3 cột ≥ lg (1 mục duy nhất: 1 cột — không co thành nửa ô lạc lõng, BL-056). Rỗng → không dựng.
 */
export function DetailFeatureList({ items, initialCount = 5, expandLabel, image }: DetailFeatureListProps) {
  const t = useTranslations("detailKit.expand");
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const collapsible = items.length > initialCount;

  return (
    <div className={cn("grid gap-6", image && "@md/detail:grid-cols-2 @md/detail:items-start")}>
      {image && <ResponsiveImage media={image} sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw" aspectRatio="4 / 3" className="rounded-[20px]" />}
      <div className="min-w-0">
        <ul id={listId} className={cn("grid gap-3", !image && items.length > 1 && "@md/detail:grid-cols-2 @2xl/detail:grid-cols-3")}>
          {items.map((item, position) => (
            <li key={`${item.title}-${position}`} hidden={collapsible && !expanded && position >= initialCount} className="flex gap-3 rounded-[14px] border border-border p-3">
              <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-accent-text">
                {item.icon ?? <CheckCircle size={20} />}
              </span>
              <div className="min-w-0">
                <p className="text-small font-semibold text-text">{item.title}</p>
                {item.description && <p className="text-xsmall text-text-muted">{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
        {collapsible && (
          <div className="mt-3 flex justify-end">
            <DetailExpandButton expanded={expanded} onToggle={() => setExpanded((value) => !value)} controls={listId} moreLabel={expandLabel ?? t("showAll")} lessLabel={t("showLess")} />
          </div>
        )}
      </div>
    </div>
  );
}
