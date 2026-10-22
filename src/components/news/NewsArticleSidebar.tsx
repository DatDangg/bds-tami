import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import type { TocHeading } from "@/lib/content/section-headings";
import { cn } from "@/lib/utils";
import { NewsTocSidebar } from "./NewsToc";

interface NewsArticleSidebarProps {
  /** Heading cấp gốc của bài (`collectTocHeadings`); rỗng → không có mục lục, chỉ còn thẻ tư vấn. */
  headings: TocHeading[];
  /** Nhãn (đã dịch) của mục lục. */
  tocLabel: string;
  /** Đích của nút tư vấn (`/lien-he` theo ngôn ngữ), KHÔNG có form ở cột này (spec F5). */
  contactHref: string;
  className?: string;
}

/**
 * Cột trái trang bài viết (design `chi-tiet-tin-tuc.webp`, BL-054): "Mục lục" (≥ lg, chỉ khi bài có heading) + thẻ "Tư vấn miễn phí" (chữ + nút → liên hệ).
 * ≥ lg dính dưới header khi cuộn; nhỏ hơn lg nơi dùng đặt cột này SAU nội dung (mục lục khi đó là khối gập đầu bài, bản cột trái ẩn) nên chỉ còn thẻ tư vấn.
 * Server Component. Thẻ tư vấn là `section` có nhãn (`h2`). Bỏ cột phải "Bài viết mới" của BL-045 (design không có).
 */
export function NewsArticleSidebar({ headings, tocLabel, contactHref, className }: NewsArticleSidebarProps) {
  const t = useTranslations("page.newsDetail.v2");
  return (
    <aside className={cn("flex flex-col gap-8 lg:sticky lg:top-[calc(var(--sticky-top)+1.5rem)] lg:self-start", className)}>
      {headings.length > 0 && <NewsTocSidebar headings={headings} label={tocLabel} />}
      <section aria-labelledby="article-consult" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{t("consultEyebrow")}</p>
        <h2 id="article-consult" className="font-display text-h4">
          {t("consultTitle")}
        </h2>
        <p className="text-small text-text-secondary">{t("consultText")}</p>
        <Link href={contactHref} className={cn(buttonVariants(), "mt-1")}>
          {t("consultCta")}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </aside>
  );
}
