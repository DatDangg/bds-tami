import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { NewsCardData } from "@/lib/news/news-view";
import { cn } from "@/lib/utils";

type NewsCardVariant = "card" | "feature" | "row";
type HeadingLevel = "h2" | "h3";

interface NewsCardProps {
  data: NewsCardData;
  /** `card`: thẻ dọc của lưới · `feature`: bài lớn đầu trang (S10) · `row`: hàng nhỏ ảnh 4:3 bên trái. */
  variant?: NewsCardVariant;
  /** Cấp heading của tiêu đề thẻ, theo vị trí trong trang (không nhảy cấp). */
  headingLevel: HeadingLevel;
  /** Ảnh LCP của trang (chỉ bài lớn đầu trang S10): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Ghi đè `sizes` mặc định của biến thể khi thẻ nằm trong cột hẹp hơn (vd khối Tin tức trang chủ). */
  sizes?: string;
  /** Thẻ `card` nằm trên nền tối (khối Tin tức trang chủ): giữ thẻ phẳng trong suốt như chợ; mặc định thẻ trắng bo 20px ở trang danh sách. */
  onDark?: boolean;
}

const IMAGE_ZOOM = "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

/** `sizes` theo cột thật của từng biến thể (design-spec §1.3): ảnh nhỏ không tải bản lớn. */
const IMAGE_SIZES: Record<NewsCardVariant, string> = {
  card: "(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  feature: "(min-width: 1024px) 700px, 100vw",
  row: "120px",
};

const IMAGE_RATIO: Record<NewsCardVariant, string> = { card: "16/10", feature: "16/10", row: "4/3" };

/**
 * Thẻ Tin tức (design-spec §3.2 "Tin/ưu đãi"): cả thẻ là MỘT link (không lồng link). Danh mục là chữ metadata, không phải link riêng
 * (nên không lồng `<a>`); tiêu đề là heading để người đọc màn hình duyệt theo heading. Server Component.
 */
export function NewsCard({ data, variant = "card", headingLevel, priority = false, sizes, onDark = false }: NewsCardProps) {
  const Heading = headingLevel;
  const isRow = variant === "row";
  const isFeature = variant === "feature";
  // Chỉ thẻ lưới `card` trên nền sáng là thẻ trắng viền (như PostCard); feature/row và thẻ trên nền tối giữ phẳng.
  const isBoxed = variant === "card" && !onDark;
  return (
    <article className={cn(isBoxed && "h-full")}>
      <Link
        href={data.href}
        className={cn(
          "group flex min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring",
          isBoxed ? "h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md" : "gap-4 rounded-xl",
          isRow ? "flex-row items-start" : "flex-col",
        )}
      >
        <div className={cn("shrink-0 overflow-hidden bg-surface-muted", !isBoxed && "rounded-xl", isRow ? "w-24 sm:w-[120px]" : "w-full", IMAGE_ZOOM)} style={{ aspectRatio: IMAGE_RATIO[variant] }}>
          {data.cover && (
            <ResponsiveImage media={data.cover} sizes={sizes ?? IMAGE_SIZES[variant]} aspectRatio={IMAGE_RATIO[variant]} priority={priority} decorative />
          )}
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col gap-2", isBoxed && "p-4")}>
          {data.categoryName && <p className="text-xsmall font-semibold text-accent-text">{data.categoryName}</p>}
          <Heading
            className={cn(
              "transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text",
              // Chỉ nạp font-display 400/500 (fonts.ts): 600 sẽ bị tổng hợp thành bold giả.
              isFeature ? "font-display font-medium text-h3 lg:text-h2-sm" : "text-h4 font-semibold",
            )}
          >
            {data.title}
          </Heading>
          {!isRow && data.excerpt && (
            <p className={cn("text-body text-text-secondary", isFeature ? "line-clamp-3" : "line-clamp-2")}>{data.excerpt}</p>
          )}
          {data.dateLabel && data.publishedAt && (
            <time dateTime={data.publishedAt} className="text-xsmall text-text-muted">
              {data.dateLabel}
            </time>
          )}
        </div>
      </Link>
    </article>
  );
}
