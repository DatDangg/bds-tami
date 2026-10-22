import { useTranslations } from "next-intl";
import Link from "next/link";
import { Clock } from "@/components/icons";
import { CARD_IMAGE_ZOOM, CARD_LINK_CLASS, CardFooter } from "@/components/layout/card-parts";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { NewsCardData } from "@/lib/news/news-view";
import { cn } from "@/lib/utils";

type NewsCardVariant = "card" | "grid" | "row";
type HeadingLevel = "h2" | "h3";

interface NewsCardProps {
  data: NewsCardData;
  /**
   * `card`: thẻ dọc gọn (trang chủ, bài liên quan cũ) · `grid`: thẻ lưới `/tin-tuc` BL-054 (badge danh mục + ngày, tiêu đề 2 dòng, tóm tắt 3 dòng,
   * "N phút đọc" + mũi tên — cũng dùng cho "Bài viết liên quan") · `row`: hàng nhỏ ảnh 4:3 bên trái.
   */
  variant?: NewsCardVariant;
  /** Cấp heading của tiêu đề thẻ, theo vị trí trong trang (không nhảy cấp). */
  headingLevel: HeadingLevel;
  /** Ảnh LCP của trang (chỉ bài nổi bật đầu trang): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Ghi đè `sizes` mặc định của biến thể khi thẻ nằm trong cột hẹp hơn (vd khối Tin tức trang chủ). */
  sizes?: string;
  /** Thẻ `card` nằm trên nền tối (khối Tin tức trang chủ): giữ thẻ phẳng trong suốt như chợ; mặc định thẻ trắng bo 20px ở trang danh sách. */
  onDark?: boolean;
}

/** `sizes` theo cột thật của từng biến thể (design-spec §1.3): ảnh nhỏ không tải bản lớn. */
const IMAGE_SIZES: Record<NewsCardVariant, string> = {
  card: "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  // Lưới 3 cột trong cột chính (~70% khung, cạnh cột phải) ≥ lg; 2 cột từ md.
  grid: "(min-width: 1280px) 280px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw",
  row: "120px",
};

const IMAGE_RATIO: Record<NewsCardVariant, string> = { card: "16/10", grid: "16/10", row: "4/3" };

/**
 * Badge danh mục của Tin tức (BL-054): viên thuốc nhỏ chữ hoa. Nền sáng: vàng nhạt token (`primary-soft` + chữ `badge-foreground`, 9.7:1); trên ảnh tối (`on-image`):
 * vàng đặc + chữ `badge-foreground` như Badge `primary`. Chữ, không phải link.
 */
export function NewsCategoryBadge({ name, tone = "light", className }: { name: string; tone?: "light" | "on-image"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block max-w-full truncate rounded-pill px-2.5 py-0.5 text-xsmall font-semibold tracking-wide uppercase",
        tone === "on-image" ? "bg-primary text-badge-foreground" : "bg-primary-soft text-badge-foreground",
        className,
      )}
    >
      {name}
    </span>
  );
}

/** "N phút đọc" (đồng hồ + chữ) của thẻ Tin tức; không có số phút → không render. */
export function NewsReadTime({ minutes, className }: { minutes: number | undefined; className?: string }) {
  const t = useTranslations("page.news");
  if (!minutes) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Clock size={16} aria-hidden="true" className="shrink-0" />
      {t("readTime", { minutes })}
    </span>
  );
}

interface GridProps {
  data: NewsCardData;
  headingLevel: HeadingLevel;
  priority: boolean;
  sizes: string | undefined;
}

/**
 * Thẻ lưới `/tin-tuc` (design `tin-tuc.webp`, BL-054): thẻ trắng bo 20px như thẻ Dự án; ảnh 16:10 → badge danh mục + ngày → tiêu đề 2 dòng →
 * tóm tắt 3 dòng → "N phút đọc" + mũi tên tròn. Cả thẻ là MỘT link. Dùng lại cho "Bài viết liên quan" (P2-T02).
 */
function GridNewsCard({ data, headingLevel: Heading, priority, sizes }: GridProps) {
  return (
    <article className="h-full">
      <Link href={data.href} className={CARD_LINK_CLASS}>
        <div className={cn("w-full shrink-0 overflow-hidden bg-surface-muted", CARD_IMAGE_ZOOM)} style={{ aspectRatio: IMAGE_RATIO.grid }}>
          {data.cover && <ResponsiveImage media={data.cover} sizes={sizes ?? IMAGE_SIZES.grid} aspectRatio={IMAGE_RATIO.grid} priority={priority} decorative />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4 sm:p-5">
          {(data.categoryName || (data.dateLabel && data.publishedAt)) && (
            <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xsmall text-text-muted">
              {data.categoryName && <NewsCategoryBadge name={data.categoryName} />}
              {data.dateLabel && data.publishedAt && <time dateTime={data.publishedAt}>{data.dateLabel}</time>}
            </p>
          )}
          <Heading className="line-clamp-2 min-h-[2lh] text-h4 font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</Heading>
          {data.excerpt && <p className="line-clamp-3 text-small text-text-secondary">{data.excerpt}</p>}
          <CardFooter>
            <NewsReadTime minutes={data.readMinutes} className="text-xsmall" />
          </CardFooter>
        </div>
      </Link>
    </article>
  );
}

/**
 * Thẻ Tin tức (design-spec §3.2 "Tin/ưu đãi"): cả thẻ là MỘT link (không lồng link). Danh mục là chữ metadata, không phải link riêng
 * (nên không lồng `<a>`); tiêu đề là heading để người đọc màn hình duyệt theo heading. Server Component.
 */
export function NewsCard({ data, variant = "card", headingLevel, priority = false, sizes, onDark = false }: NewsCardProps) {
  if (variant === "grid") return <GridNewsCard data={data} headingLevel={headingLevel} priority={priority} sizes={sizes} />;
  const Heading = headingLevel;
  const isRow = variant === "row";
  // Chỉ thẻ lưới `card` trên nền sáng là thẻ trắng viền (như PostCard); row và thẻ trên nền tối giữ phẳng.
  const isBoxed = variant === "card" && !onDark;
  return (
    <article className={cn(isBoxed && "h-full")}>
      <Link
        href={data.href}
        className={cn(
          isBoxed ? CARD_LINK_CLASS : "group flex min-h-11 gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring",
          isRow ? "flex-row items-start" : "flex-col",
        )}
      >
        <div className={cn("shrink-0 overflow-hidden bg-surface-muted", !isBoxed && "rounded-xl", isRow ? "w-24 sm:w-[120px]" : "w-full", CARD_IMAGE_ZOOM)} style={{ aspectRatio: IMAGE_RATIO[variant] }}>
          {data.cover && (
            <ResponsiveImage media={data.cover} sizes={sizes ?? IMAGE_SIZES[variant]} aspectRatio={IMAGE_RATIO[variant]} priority={priority} decorative />
          )}
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col gap-2", isBoxed && "p-4 sm:p-5")}>
          {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
          <Heading
            className={cn(
              "text-h4 font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text",
              isBoxed && "line-clamp-2 min-h-[2lh]",
            )}
          >
            {data.title}
          </Heading>
          {/* Thẻ boxed (BL-045): ảnh, danh mục, tên 2 dòng, ngày + mũi tên tròn — không tóm tắt, như thẻ Dự án. */}
          {!isRow && !isBoxed && data.excerpt && <p className="line-clamp-2 text-body text-text-secondary">{data.excerpt}</p>}
          {isBoxed ? (
            <CardFooter>
              {data.dateLabel && data.publishedAt && (
                <>
                  <Clock size={16} aria-hidden="true" className="shrink-0" />
                  <time dateTime={data.publishedAt} className="text-xsmall">
                    {data.dateLabel}
                  </time>
                </>
              )}
            </CardFooter>
          ) : (
            data.dateLabel &&
            data.publishedAt && (
              <time dateTime={data.publishedAt} className="text-xsmall text-text-muted">
                {data.dateLabel}
              </time>
            )
          )}
        </div>
      </Link>
    </article>
  );
}
