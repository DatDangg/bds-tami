import type { ReactNode } from "react";

/**
 * Khung `<header>` dính đầu trang, dạng thanh NỔI bo tròn kính mờ sáng (BL-020, design-spec §2.1). `<header>` nằm trong luồng (chiếm
 * `--header-offset` = lề + thanh) nên trang không có hero không bị header che và không CLS; chỉ thanh bên trong (`.site-header-bar`,
 * globals.css) là phần nhìn thấy/bấm được (`pointer-events` trả lại cho nó để vùng lề trong suốt không chặn nội dung phía dưới).
 * Luôn một biến thể (kể cả trên hero) nên không cần JS/observer: chữ + logo vàng luôn nằm trên kính sáng.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  return (
    <header className="site-header pointer-events-none sticky top-0 z-(--z-header) px-2 py-2 lg:px-4 lg:py-4 print:hidden">
      {/* 84rem = --container-container (80rem) + 4rem chỗ thở hai bên: thanh nổi rộng hơn nội dung một chút. */}
      <div className="site-header-bar pointer-events-auto mx-auto w-full max-w-[84rem] rounded-pill shadow-md">{children}</div>
    </header>
  );
}
