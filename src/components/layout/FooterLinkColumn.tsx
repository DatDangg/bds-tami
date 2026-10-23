"use client";

import { useId, useState } from "react";
import { CaretDown } from "@/components/icons";
import { useMediaQuery } from "@/components/layout/use-environment";
import { cn } from "@/lib/utils";
import { NavAnchor } from "./NavAnchor";
import type { FooterColumnView } from "./shell-data";

const MD_QUERY = "(min-width: 768px)";

/**
 * Một cột link chân trang (design-spec §2.4): < md là accordion đóng mặc định (h2 bọc nút `aria-expanded`/`aria-controls`),
 * ≥ md tiêu đề là chữ thường và mọi link hiện. Server (và trước khi hydrate) render dạng nút vì mobile-first; link luôn có trong HTML,
 * chỉ ẩn bằng `max-md:hidden` (display:none → ra khỏi tab order/AT) nên crawler và desktop không mất link kể cả khi chưa có JS.
 * Không dùng thuộc tính `hidden`: Tailwind v4 đặt `[hidden]{display:none!important}` nên sẽ thắng lưới ≥ md (ARCHITECTURE L6-T05).
 */
export function FooterLinkColumn({ column }: { column: FooterColumnView }) {
  const isMd = useMediaQuery(MD_QUERY);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const titleClass = "text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase";
  return (
    <div className="flex flex-col md:gap-3">
      <h2 className={titleClass}>
        {isMd ? (
          column.title
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 text-left"
          >
            <span>{column.title}</span>
            <CaretDown size={16} aria-hidden="true" className={cn("shrink-0 transition-transform duration-(--duration-fast)", open && "rotate-180")} />
          </button>
        )}
      </h2>
      <ul id={listId} className={cn("flex flex-col", !isMd && !open && "max-md:hidden")}>
        {column.links.map((link) => (
          <li key={link.href + link.label}>
            <NavAnchor link={link} className="inline-flex min-h-11 min-w-11 items-center text-small text-text-secondary transition-colors duration-(--duration-fast) hover:text-text" />
          </li>
        ))}
      </ul>
    </div>
  );
}
