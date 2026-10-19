"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  /** `id` của khối đích. */
  id: string;
  label: string;
}

// Vạch "đang xem": khối đầu tiên (theo thứ tự trang) đang chiếm dải từ ngay dưới header nổi + thanh viên thuốc tới 55% chiều cao viewport. rootMargin không dùng được var():
// lấy mức xấp xỉ scroll-margin lớn nhất (≥ lg: header 104 + thanh 54 + khe 18 = 176px) để khối vừa cuộn tới neo luôn nằm trong dải.
const OBSERVER_MARGIN = "-176px 0px -45% 0px";
// Sau khi bấm một mục, cuộn mượt đi ngang nhiều khối: bỏ qua kết quả quan sát trong lúc cuộn để mục vừa bấm không bị khối ở giữa chiếm (và để
// khối đứng cạnh nhau ở desktop như Pháp lý / Chính sách vẫn chọn được mục thứ hai: theo thứ tự trang, mục đầu luôn thắng khi cả hai cùng hiện).
const SCROLL_LOCK_MS = 1000;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Thanh mục con dạng viên thuốc dính dưới header nổi (design-spec S03 khối 3): đặt tại `top: var(--header-offset)` nên giữ khe như một thanh nổi thứ hai (BL-020 m-4); `nav` trong suốt + `pointer-events-none` để không chặn click vùng nội dung bên cạnh viên thuốc. Mục đang xem do IntersectionObserver đánh dấu (`aria-current="location"`);
 * bấm cuộn mượt tới khối (tắt khi giảm chuyển động) rồi chuyển focus vào khối để người dùng bàn phím/đọc màn hình đi tiếp từ đó.
 * Link là neo `#id` thật nên chạy cả khi chưa có JS. < lg cuộn ngang và mục đang xem tự cuộn vào giữa.
 */
export function ProjectSubNav({ items }: { items: SubNavItem[] }) {
  const t = useTranslations("page.projectDetail");
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);
  const scrollLocked = useRef(false);
  const idsKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = idsKey.split("|");
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = ids.find((id) => visible.has(id));
        if (current && !scrollLocked.current) setActiveId(current);
      },
      { rootMargin: OBSERVER_MARGIN },
    );
    for (const id of ids) {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    }
    return () => observer.disconnect();
  }, [idsKey]);

  // Mục đang xem tự cuộn vào giữa thanh (chỉ có tác dụng khi thanh tràn, tức < lg); chỉ cuộn ngang thanh, không cuộn trang. `ul` là `relative` để `offsetLeft` tính từ mép thanh.
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    // Tức thì (không "smooth"): cuộn mượt của thanh bị huỷ khi trang đang cuộn mượt tới khối vừa bấm (đã kiểm ở Chromium).
    list.scrollTo({ left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2, behavior: "auto" });
  }, [activeId]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // replaceState không phát hashchange; khối accordion (Pháp lý / Chính sách) nghe sự kiện này để tự mở trước khi cuộn tới.
    history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
    scrollLocked.current = true;
    window.setTimeout(() => {
      scrollLocked.current = false;
    }, SCROLL_LOCK_MS);
    setActiveId(id);
  }

  return (
    <nav aria-label={t("subNavLabel")} className="pointer-events-none sticky top-(--header-offset) z-(--z-sticky) mx-auto w-full max-w-container px-gutter print:hidden">
      <ul
        ref={listRef}
        className="pointer-events-auto relative flex w-fit max-w-full gap-1 overflow-x-auto rounded-pill border border-border bg-surface p-1 whitespace-nowrap shadow-md [scrollbar-width:none]"
      >
        {items.map((item) => {
          const current = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                onClick={(event) => handleClick(event, item.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-pill px-4 text-small font-semibold transition-colors duration-(--duration-fast)",
                  current ? "bg-dark text-on-dark" : "text-text-secondary hover:bg-surface-muted hover:text-text",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
