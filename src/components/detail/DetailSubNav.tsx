"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  /** `id` của khối đích. */
  id: string;
  label: string;
}

// Vạch "đang xem": khối đầu tiên (theo thứ tự trang) đang chiếm dải từ ngay dưới thanh viên thuốc dính tới 55% chiều cao viewport. rootMargin không dùng được var():
// lấy mức xấp xỉ scroll-margin lớn nhất trên trang chi tiết (≥ lg: --sticky-top 16 + thanh 54 + khe 18 = 88px; < lg nhỏ hơn 8px) để khối vừa cuộn tới neo luôn nằm trong dải.
const OBSERVER_TOP_PX = 88;
const OBSERVER_MARGIN = `-${OBSERVER_TOP_PX}px 0px -45% 0px`;
// Sau khi bấm một mục, cuộn mượt đi ngang nhiều khối: bỏ qua kết quả quan sát trong lúc cuộn để mục vừa bấm không bị khối ở giữa chiếm (và để
// khối đứng cạnh nhau ở desktop như Pháp lý / Chính sách vẫn chọn được mục thứ hai: theo thứ tự trang, mục đầu luôn thắng khi cả hai cùng hiện).
const SCROLL_LOCK_MS = 1000;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Thanh mục con dạng viên thuốc dính (design-spec S03 khối 3; dùng chung chi tiết dự án + cho thuê): đặt tại `top: var(--sticky-top)` = đúng lề trên của header nổi (header ẩn khi cuộn trên trang chi tiết, BL-027); `nav` trong suốt + `pointer-events-none` để không chặn click vùng nội dung bên cạnh viên thuốc. Mục đang xem do IntersectionObserver đánh dấu (`aria-current="location"`; cuộn qua hết mục cuối thì không mục nào được đánh dấu);
 * bấm cuộn mượt tới khối (tắt khi giảm chuyển động) rồi chuyển focus vào khối để người dùng bàn phím/đọc màn hình đi tiếp từ đó.
 * Bề rộng thanh = khung nội dung bên dưới (BL-028): cùng `max-w-container` + `px-gutter` với lưới thẻ nội dung + thẻ phụ nên hai mép thẳng hàng; thanh `w-full`, nút căn trái, cả lúc chưa dính lẫn dính đỉnh.
 * Link là neo `#id` thật nên chạy cả khi chưa có JS. < lg cuộn ngang và mục đang xem tự cuộn vào giữa.
 */
export function DetailSubNav({ items, label }: { items: SubNavItem[]; label: string }) {
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
        if (scrollLocked.current) return;
        if (current) {
          setActiveId(current);
          return;
        }
        // Tập rỗng: chỉ bỏ active khi đã cuộn QUA mục cuối (nó nằm hẳn phía trên dải); ở trên mục đầu / khe giữa mục thì giữ nguyên.
        const lastTarget = document.getElementById(ids[ids.length - 1] ?? "");
        if (lastTarget && lastTarget.getBoundingClientRect().bottom <= OBSERVER_TOP_PX) setActiveId("");
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
    <nav aria-label={label} className="pointer-events-none sticky top-(--sticky-top) z-(--z-sticky) mx-auto w-full max-w-container px-gutter print:hidden">
      <ul
        ref={listRef}
        className="pointer-events-auto relative flex w-full gap-1 overflow-x-auto rounded-pill border border-border bg-surface p-1 whitespace-nowrap shadow-md [scrollbar-width:none]"
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
                  "inline-flex min-h-11 items-center rounded-pill px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring text-small font-semibold transition-colors duration-(--duration-fast)",
                  current ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-muted hover:text-text",
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
