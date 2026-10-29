import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** id của h2, để khối dùng làm `aria-labelledby`. */
  id: string;
  title: string;
  /** Dòng nhỏ trên tiêu đề; thiếu thì ẩn. */
  eyebrow?: string | null;
  /** Mô tả dưới gạch; thiếu thì ẩn. */
  description?: string | null;
  /** Khoảng cách dưới đầu khối (mặc định `mb-10`; khối có thêm tablist dùng `mb-8`). */
  className?: string;
}

/** Đầu khối trang chủ dùng chung (BL-101): căn giữa — eyebrow, tiêu đề h2, gạch ngắn, mô tả. Server Component. */
export function SectionHeading({ id, title, eyebrow, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-10 flex flex-col items-center gap-3 text-center", className)}>
      {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
      <h2 id={id} className="font-display text-h2">
        {title}
      </h2>
      <span aria-hidden="true" className="h-0.5 w-12 bg-primary" />
      {description && <p className="max-w-[80ch] text-lead text-text-secondary">{description}</p>}
    </div>
  );
}
