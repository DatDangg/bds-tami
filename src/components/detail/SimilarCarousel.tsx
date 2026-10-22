import Link from "next/link";
import { type ReactNode, useId } from "react";
import { ArrowRight } from "@/components/icons";
import { CardSlider, type CardSliderLabels } from "@/components/layout/CardSlider";
import { SectionHeading } from "@/components/layout/SectionHeading";

interface SimilarCarouselProps {
  /** Thẻ đã dựng (vd `<ProjectCard headingLevel="h3" />`); rỗng → không dựng khối. */
  items: ReactNode[];
  title: string;
  /** Phần cuối tiêu đề màu nhấn ("tương tự"). */
  titleAccent?: string;
  eyebrow?: string;
  /** Link "Xem tất cả …" bên phải đầu khối. */
  viewAll?: { href: string; label: string };
  /** Nhãn ARIA của `CardSlider` (chuỗi thô, giữ `{index}` / `{total}`). */
  labels: CardSliderLabels;
}

/**
 * Khối "… tương tự" cuối trang chi tiết (BL-052, design `detail-du-an`; DECISIONS #6): dải nền vàng nhạt `bg-primary-subtle` (BL-058), đầu khối canh trái (eyebrow + `h2` hai màu) + link "Xem tất cả …" bên phải,
 * rồi `CardSlider` dùng chung với mũi tên tròn hai mép (`arrows="sides"`, từ md; mobile vuốt). Server Component.
 */
export function SimilarCarousel({ items, title, titleAccent, eyebrow, viewAll, labels }: SimilarCarouselProps) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="border-t border-border bg-primary-subtle py-section-tight">
      <div className="mx-auto mb-8 flex w-full max-w-container flex-wrap items-end justify-between gap-x-6 gap-y-3 px-gutter">
        <SectionHeading id={headingId} {...(eyebrow ? { eyebrow } : {})} title={title} {...(titleAccent ? { titleAccent } : {})} />
        {viewAll && (
          <Link
            href={viewAll.href}
            className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {viewAll.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="mx-auto w-full max-w-container">
        <CardSlider items={items} labelledBy={headingId} labels={labels} arrows="sides" />
      </div>
    </section>
  );
}
