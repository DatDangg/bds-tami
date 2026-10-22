import Link from "next/link";
import { useTranslations } from "next-intl";
import { DETAIL_ASIDE_STICKY_CLASS } from "@/components/detail/DetailLayout";
import { DetailAsideFit } from "@/components/detail/DetailAsideFit";
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
 * Cột trái trang bài viết (design `chi-tiet-tin-tuc-v2.webp`, BL-062): "Mục lục" (≥ lg, chỉ khi bài có heading) + thẻ "Tư vấn miễn phí" (chữ + nút → liên hệ), CÙNG dính dưới header.
 * Dùng khung dính BL-061: ô lưới = `DetailAsideFit as="div"` (không phải landmark `aside`) với `--detail-aside-top` = ngay dưới header nổi; con đầu mang `DETAIL_ASIDE_STICKY_CLASS`,
 * ô lưới cao bằng hàng (lưới KHÔNG `items-start`) nên cột dính tới hết thân bài và thôi dính trước khối nằm ngoài lưới ("Bài viết liên quan").
 * < lg nơi dùng đặt cột này SAU nội dung (mục lục khi đó là khối gập đầu bài, bản cột trái ẩn) nên chỉ còn thẻ tư vấn. Server Component; thẻ tư vấn là `section` có nhãn (`h2`).
 */
export function NewsArticleSidebar({ headings, tocLabel, contactHref, className }: NewsArticleSidebarProps) {
  const t = useTranslations("page.newsDetail.v2");
  return (
    <DetailAsideFit as="div" className={cn("[--detail-aside-top:calc(var(--sticky-top)+1.5rem)]", className)}>
      <div className={cn("flex flex-col gap-6", DETAIL_ASIDE_STICKY_CLASS)}>
        {headings.length > 0 && <NewsTocSidebar headings={headings} label={tocLabel} />}
        <section aria-labelledby="article-consult" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5">
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
      </div>
    </DetailAsideFit>
  );
}
