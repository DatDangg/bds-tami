import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "dark";

/**
 * Khung khối trong cột chính (không còn nền full-bleed): ngăn bằng đường kẻ trên, khối đầu không kẻ.
 * Trong `DetailLayout sectionStyle="cards"` (gốc `group/detail` + `data-section-style`): thẻ trắng bo 20px, bỏ đường kẻ trên.
 * Xuất ra để khối tự dựng khung (accordion "Điều khoản" tin đã thuê) cùng kiểu với `DetailSection`.
 */
export const DETAIL_SECTION_FRAME_CLASS =
  "border-t border-border py-section-tight first:border-t-0 group-data-[section-style=cards]/detail:rounded-[20px] group-data-[section-style=cards]/detail:border-t-0 group-data-[section-style=cards]/detail:bg-surface group-data-[section-style=cards]/detail:p-5 group-data-[section-style=cards]/detail:md:p-8";

const TONE_CLASS: Record<SectionTone, string> = {
  default: DETAIL_SECTION_FRAME_CLASS,
  // Section nội dung tối duy nhất của trang (design-spec S03 khối 9): thẻ tối bo 20px trong cột chính.
  dark: "theme-dark-block my-section-tight rounded-[20px] p-6 xl:p-10",
};

interface DetailSectionProps {
  /** `id` phần tử: đích của thanh mục con. */
  id: string;
  title: string;
  tone?: SectionTone;
  /** Dòng nhỏ vàng trên tiêu đề (mockup `.block .eyebrow`); chỉ truyền ở trang dùng kiểu thẻ. */
  eyebrow?: string;
  /** Đoạn mô tả ngắn dưới tiêu đề (BL-052, design `detail-du-an`); không truyền thì DOM như cũ. */
  description?: string | null;
  children: ReactNode;
}

/**
 * Khung một khối trong CỘT CHÍNH của trang chi tiết dùng chung (dự án, cho thuê; thẻ trắng + lề do `DetailLayout` lo): `section[aria-labelledby]` + `h2` + đường kẻ trên (khối tối là thẻ bo 20px). `scroll-mt` = `--sticky-top` (8/16px: trên trang chi tiết header ẩn khi cuộn) +
 * thanh mục con viên thuốc dính (~54px) + khe 18px (= 4.5rem) để tiêu đề không bị che khi cuộn tới; `tabIndex={-1}` để thanh mục con chuyển focus vào khối được chọn.
 */
export function DetailSection({ id, title, tone = "default", eyebrow, description, children }: DetailSectionProps) {
  const headingId = useId();
  return (
    <section id={id} tabIndex={-1} aria-labelledby={headingId} className={cn("scroll-mt-[calc(var(--sticky-top)+4.5rem)] focus:outline-none", TONE_CLASS[tone])}>
      {eyebrow && <p className="mb-1.5 text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
      <h2 id={headingId} className={cn("font-display", description ? "mb-2" : eyebrow ? "mb-5" : "mb-8", eyebrow ? "text-h3" : "text-h2")}>
        {title}
      </h2>
      {description && <p className={cn("text-text-secondary", eyebrow ? "mb-5" : "mb-8")}>{description}</p>}
      {children}
    </section>
  );
}
