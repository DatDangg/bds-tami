import type { ReactNode } from "react";

/**
 * Khung chung của các nút nổi góc phải-dưới (nút lên đầu trang + nút liên hệ), xếp dọc, neo theo đáy nên nút phía trên hiện/ẩn không làm xê dịch nút dưới.
 * Không đè banner cookie / thanh "Nhận tư vấn" dính đáy: đáy cộng `--floating-bottom-offset` (banner cookie đặt trên `<html>`, mặc định 0) và `--sticky-cta-height` (trang chi tiết dự án, mặc định 0).
 * `pointer-events-none` để vùng trống của khung không chặn click nội dung phía sau; các con tự bật lại `pointer-events-auto`.
 */
export function FloatingDock({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--floating-bottom-offset,0px)+var(--sticky-cta-height,0px))] z-(--z-floating) flex flex-col items-end gap-3 print:hidden">
      {children}
    </div>
  );
}
