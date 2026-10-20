"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DetailAsideFitProps {
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
}

/**
 * `<aside>` của khung chi tiết: đo chiều cao thẻ phụ (phần tử con đầu) và ghi `--detail-aside-h` lên chính aside để `DETAIL_ASIDE_CARD_CLASS`
 * tính `top` dính = min(dưới thanh mục con, đáy viewport − chiều cao thẻ − 1rem). CSS thuần không biết chiều cao của chính thẻ sticky nên
 * không thể vừa "dính dưới thanh mục con khi vừa viewport" vừa "dính theo đáy khi cao hơn" — thẻ cao hơn viewport cuộn theo trang tới khi
 * đáy thẻ chạm đáy viewport rồi mới dính, nên không cần `max-h` + cuộn riêng. Chỉ đổi biến CSS, DOM thẻ con (Server Component) giữ nguyên.
 */
export function DetailAsideFit({ children, className, "aria-labelledby": labelledBy }: DetailAsideFitProps) {
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const aside = asideRef.current;
    const card = aside?.firstElementChild;
    if (!aside || !card || typeof ResizeObserver === "undefined") return;
    const publishHeight = () => aside.style.setProperty("--detail-aside-h", `${card.getBoundingClientRect().height}px`);
    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <aside ref={asideRef} {...(labelledBy ? { "aria-labelledby": labelledBy } : {})} className={className}>
      {children}
    </aside>
  );
}
