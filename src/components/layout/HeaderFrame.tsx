"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

/** Đánh dấu khối hero ảnh toàn màn hình: header trong suốt đè lên nó (design-spec §2.1, S01.1). */
export const HEADER_HERO_ATTRIBUTE = "data-header-hero";

/**
 * Khung `<header>` dính đầu trang. Biến thể do CSS quyết định (`.site-header` ở globals.css): trang có phần tử `[data-header-hero]` trong
 * `main` (selector `:has`, nên đúng ngay từ HTML server, không nháy khi hydrate) thì header trong suốt + logo/chữ sáng; component này chỉ
 * thêm một việc CSS không làm được: khi hero ra khỏi vùng dưới header (IntersectionObserver) thì `data-solid="true"` để về header đặc.
 * Không có IntersectionObserver (trình duyệt cũ, jsdom) hoặc chưa hydrate: header trong suốt vẫn đọc được nhờ gradient tối phía trên.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  // Chiều cao header đổi theo breakpoint (64px → 72px từ lg): observer dựng lại để vùng quan sát luôn bắt đầu ngay dưới header.
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeaderHeight(header.offsetHeight));
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const hero = document.querySelector(`main [${HEADER_HERO_ATTRIBUTE}]`);
    if (!header || !hero || typeof IntersectionObserver === "undefined") return;
    // Vùng quan sát bắt đầu ngay dưới header: hero còn phủ vùng đó là còn trong suốt.
    const observer = new IntersectionObserver(([entry]) => setSolid(!entry?.isIntersecting), { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname, headerHeight]);

  return (
    <header ref={headerRef} data-solid={solid} className="site-header sticky top-0 z-(--z-header) bg-surface shadow-sm print:hidden">
      {children}
    </header>
  );
}
