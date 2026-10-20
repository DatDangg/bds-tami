import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Phần cuối tiêu đề nhấn màu vàng đậm (`text-accent-text`, đạt AA trên nền sáng). */
  titleAccent?: string;
  description?: string;
  /** Cấp heading theo ngữ cảnh trang (trang con đã có `h1`). */
  as?: "h2" | "h3";
  id?: string;
  className?: string;
}

/** Đầu khối canh TRÁI theo container (mockup `.shead.left`, BL-045 #3): eyebrow → tiêu đề (+ phần nhấn) → mô tả. Server Component. */
export function SectionHeading({ eyebrow, title, titleAccent, description, as: Heading = "h2", id, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex max-w-[44rem] flex-col items-start gap-2.5 text-left", className)}>
      {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{eyebrow}</p>}
      <Heading id={id} className="font-display text-h2 text-balance">
        {title}
        {titleAccent && <> <span className="text-accent-text">{titleAccent}</span></>}
      </Heading>
      {description && <p className="text-text-secondary">{description}</p>}
    </div>
  );
}
