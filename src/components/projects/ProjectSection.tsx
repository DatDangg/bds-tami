import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "alt" | "dark";

const TONE_CLASS: Record<SectionTone, string> = {
  default: "bg-bg",
  alt: "bg-bg-alt",
  // Section nội dung tối duy nhất của trang (design-spec S03 khối 9).
  dark: "theme-dark-block",
};

interface ProjectSectionProps {
  /** `id` phần tử: đích của thanh mục con. */
  id: string;
  title: string;
  tone?: SectionTone;
  children: ReactNode;
}

/**
 * Khung một khối của trang chi tiết dự án: `section[aria-labelledby]` + `h2` + nền theo nhịp xen kẽ. `scroll-mt` = header (64/72px) +
 * thanh mục con dính (~52px) để tiêu đề không bị che khi cuộn tới; `tabIndex={-1}` để thanh mục con chuyển focus vào khối được chọn.
 */
export function ProjectSection({ id, title, tone = "default", children }: ProjectSectionProps) {
  const headingId = useId();
  return (
    <section id={id} tabIndex={-1} aria-labelledby={headingId} className={cn("scroll-mt-30 py-section-tight focus:outline-none lg:scroll-mt-32", TONE_CLASS[tone])}>
      <div className="mx-auto w-full max-w-container px-gutter">
        <h2 id={headingId} className="mb-8 font-display text-h2">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
