import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "dark";

const TONE_CLASS: Record<SectionTone, string> = {
  // Khối trong cột chính (không còn nền full-bleed): ngăn bằng đường kẻ trên, khối đầu không kẻ.
  default: "border-t border-border py-section-tight first:border-t-0",
  // Section nội dung tối duy nhất của trang (design-spec S03 khối 9): thẻ tối bo 20px trong cột chính.
  dark: "theme-dark-block my-section-tight rounded-[20px] p-6 xl:p-10",
};

interface DetailSectionProps {
  /** `id` phần tử: đích của thanh mục con. */
  id: string;
  title: string;
  tone?: SectionTone;
  children: ReactNode;
}

/**
 * Khung một khối trong CỘT CHÍNH của trang chi tiết dùng chung (dự án, cho thuê; thẻ trắng + lề do `DetailLayout` lo): `section[aria-labelledby]` + `h2` + đường kẻ trên (khối tối là thẻ bo 20px). `scroll-mt` = `--sticky-top` (8/16px: trên trang chi tiết header ẩn khi cuộn) +
 * thanh mục con viên thuốc dính (~54px) + khe 18px (= 4.5rem) để tiêu đề không bị che khi cuộn tới; `tabIndex={-1}` để thanh mục con chuyển focus vào khối được chọn.
 */
export function DetailSection({ id, title, tone = "default", children }: DetailSectionProps) {
  const headingId = useId();
  return (
    <section id={id} tabIndex={-1} aria-labelledby={headingId} className={cn("scroll-mt-[calc(var(--sticky-top)+4.5rem)] focus:outline-none", TONE_CLASS[tone])}>
      <h2 id={headingId} className="mb-8 font-display text-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}
