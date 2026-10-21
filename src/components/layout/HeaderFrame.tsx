"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Quá ngưỡng này mới coi là "đã cuộn": tránh rung do bounce đàn hồi của iOS ở đầu trang. */
const SCROLLED_THRESHOLD_PX = 4;

/**
 * Khung `<header>` dính đầu trang (BL-025, design-spec §2.1). Hai trạng thái, CÙNG chiều cao `--header-offset` nên không CLS và
 * hero/DetailSubNav/scroll-margin/HeroSlider không phải đổi:
 * - Đầu trang (mặc định SSR, không `data-scrolled`): thanh phẳng full-width lấp đầy header, góc vuông, không bóng.
 * - Đã cuộn (`data-scrolled`): thanh nổi bo tròn hai đầu (header đệm 8/16px, thanh tối đa 84rem, shadow-md).
 * Radius đích = nửa chiều cao thanh nổi (32px < lg, 36px lg+) thay vì 9999px: nội suy 9999px sẽ giữ tròn gần hết quãng rồi mới bật vuông.
 * Cả hai đều là kính mờ sáng `.site-header-bar` (globals.css) nên tương phản không đổi. `pointer-events` trả lại cho thanh để vùng lề
 * trong suốt không chặn nội dung phía dưới. Style 2 trạng thái bằng data-variant `group-data-[scrolled]`; children là server content.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(sync);
    };
    sync(); // trang khôi phục vị trí cuộn / mở neo `#...` đã ở giữa chừng ngay khi mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "" : undefined}
      className="site-header group pointer-events-none sticky top-0 z-(--z-header) h-(--header-offset) p-0 transition-[padding] duration-(--duration-slow) ease-standard motion-reduce:transition-none data-[scrolled]:px-2 data-[scrolled]:py-1.5 lg:data-[scrolled]:px-4 lg:data-[scrolled]:py-2 print:hidden"
    >
      {/* 84rem = --container-container (80rem) + 4rem chỗ thở hai bên: thanh nổi rộng hơn nội dung một chút. */}
      <div className="site-header-bar pointer-events-auto mx-auto flex h-full w-full max-w-full items-center rounded-none shadow-none transition-[max-width,border-radius,box-shadow] duration-(--duration-slow) ease-standard motion-reduce:transition-none group-data-[scrolled]:max-w-[84rem] group-data-[scrolled]:rounded-[1.625rem] lg:group-data-[scrolled]:rounded-[1.75rem] group-data-[scrolled]:shadow-md">
        {/* Chỉ NỀN thanh full-width ở đầu trang; nội dung luôn trong khung 84rem căn giữa để khi cuộn (thanh co về 84rem) logo/nút không nhảy ngang. */}
        <div className="mx-auto flex h-full w-full max-w-[84rem] items-center">{children}</div>
      </div>
    </header>
  );
}
