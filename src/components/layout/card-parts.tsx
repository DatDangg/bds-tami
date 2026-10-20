import type { ReactNode } from "react";
import { ArrowRight, MapPin } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Khung thẻ dùng chung (dự án, cho thuê, tin): trắng, bo 20px, viền token; cả thẻ là MỘT link (BL-045). */
export const CARD_LINK_CLASS =
  "group flex h-full min-h-11 flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring";

/** Zoom ảnh khi hover/focus (giữ BL-034), tắt khi người dùng giảm chuyển động. */
export const CARD_IMAGE_ZOOM =
  "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

/** Tên thẻ 2 dòng, giữ chỗ đủ 2 dòng để thẻ cùng hàng bằng chiều cao (BL-037); hover/focus đổi vàng thương hiệu (BL-034). */
export const CARD_TITLE_CLASS =
  "line-clamp-2 min-h-[2lh] font-display text-h4 transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text";

/** Nút mũi tên tròn góc phải dưới thẻ: chỉ trang trí (thẻ đã là link nên không nhận focus riêng). */
export function CardArrow() {
  return (
    <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
      <ArrowRight size={18} />
    </span>
  );
}

/** Hàng cuối thẻ: nhãn (ghim tỉnh/khu vực, hoặc ngày) bên trái + mũi tên tròn bên phải. */
export function CardFooter({ children, className, labelClassName }: { children?: ReactNode; className?: string; labelClassName?: string }) {
  return (
    <div className={cn("mt-auto flex items-center justify-between gap-3 pt-1", className)}>
      <span className={cn("flex min-w-0 items-center gap-1.5 text-small text-text-muted", labelClassName)}>{children}</span>
      <CardArrow />
    </div>
  );
}

/** Ghim + tên nơi chốn (tỉnh/thành, khu vực). */
export function CardPin({ label }: { label: string }) {
  return (
    <>
      <MapPin size={16} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );
}
