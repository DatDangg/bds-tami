"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DetailAsideFitProps {
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
  /** Phần tử gốc: `aside` (mặc định, cột liên hệ) hoặc `div` cho ô lưới dính không phải landmark (vd cột trái dính của Tin tức, BL-062). */
  as?: "aside" | "div";
}

/**
 * `<aside>` (hoặc `div` khi `as="div"`) của khung chi tiết. Ô lưới nào muốn dính tới hết hàng lưới: bọc bằng `DetailAsideFit` + con đầu mang `DETAIL_ASIDE_STICKY_CLASS`. Đo chiều cao thẻ phụ (phần tử con đầu) và ghi `--detail-aside-h` lên chính aside để `DETAIL_ASIDE_CARD_CLASS`
 * tính `top` dính = min(dưới thanh mục con, đáy viewport − chiều cao thẻ − 1rem). CSS thuần không biết chiều cao của chính thẻ sticky nên
 * không thể vừa "dính dưới thanh mục con khi vừa viewport" vừa "dính theo đáy khi cao hơn" — thẻ cao hơn viewport cuộn theo trang tới khi
 * đáy thẻ chạm đáy viewport rồi mới dính, nên không cần `max-h` + cuộn riêng. Chỉ đổi biến CSS, DOM thẻ con (Server Component) giữ nguyên.
 */
export function DetailAsideFit({ children, className, "aria-labelledby": labelledBy, as: Tag = "aside" }: DetailAsideFitProps) {
  const asideRef = useRef<HTMLDivElement>(null);

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
    <Tag ref={asideRef} {...(labelledBy && Tag === "aside" ? { "aria-labelledby": labelledBy } : {})} className={className}>
      {children}
    </Tag>
  );
}
