import type { ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Hero trang danh sách có thẻ lọc đè đáy (440px) hoặc hero ngắn (340px): chiều cao tối thiểu cố định (chữ SSR nên không CLS). */
  size: "list" | "short";
  /** Nội dung `h1` (dòng 1); mỗi trang đúng một `h1`. */
  title: string;
  /** Dòng 2 của tiêu đề, màu vàng. */
  titleAccent?: string;
  eyebrow?: string;
  /** Tối đa 2 dòng. */
  description?: string;
  /** Không có ảnh → nền tối token cùng chiều cao. Ảnh trang trí (`alt` rỗng), `priority` vì là LCP của trang con. */
  image?: MediaImage;
  /** Breadcrumb `variant="overlay"`: đặt góc trên-trái hero. */
  breadcrumb?: ReactNode;
  /** Chừa đáy cho thẻ lọc nổi đè lên mép dưới (mockup `.fcard`, `-mt-*`). Mặc định có ở `list`, không ở `short`. Đệm `pb-24 md:pb-[120px]` ghép cặp với độ kéo của nơi dùng (`CARDS_OVERLAP_PULL` trang Liên hệ, `OVERLAP_CLASS` của `CategoryListTemplate`): đổi thì đổi cả hai. */
  overlap?: boolean;
  /** Khu vực dưới mô tả (vd nút). */
  children?: ReactNode;
}

// Chiều cao TỐI THIỂU theo mockup `.phero` (440/340 ở ≥ md; 360/280 ở mobile): chữ dài / màn 375px thì hero cao thêm thay vì tràn chữ ra ngoài (chữ do server dựng nên không CLS).
const HEIGHT = { list: "min-h-[360px] md:min-h-[440px]", short: "min-h-[280px] md:min-h-[340px]" } as const;

/**
 * Hero đầu trang con (BL-045, mockup `.phero`): ảnh admin tải lên + scrim token, chữ canh trái trong container (eyebrow → `h1` + dòng vàng → mô tả),
 * breadcrumb kính ở góc trên-trái. Header nằm trong luồng phía trên nên hero KHÔNG kéo lên dưới header. Server Component; chỉ `ResponsiveImage` là client.
 */
export function PageHero({ size, title, titleAccent, eyebrow, description, image, breadcrumb, overlap = size === "list", children }: PageHeroProps) {
  // `data-*` để test/E2E bám vào hợp đồng bố cục thay vì chuỗi class Tailwind.
  return (
    <section data-hero-size={size} className={cn("theme-dark-block relative isolate flex items-end overflow-hidden bg-dark-deep text-on-dark", HEIGHT[size])}>
      {image && (
        <>
          <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-banner-scrim" />
          {/* Nền tối dày hơn ở phía chữ (trái) như mockup: chữ + breadcrumb trên ảnh sáng vẫn đạt AA. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-banner-scrim to-transparent" />
        </>
      )}
      {breadcrumb && (
        <div className="absolute inset-x-0 top-5 z-10">
          <div className="mx-auto w-full max-w-container px-gutter">{breadcrumb}</div>
        </div>
      )}
      <div className={cn("mx-auto flex w-full max-w-container flex-col items-start gap-3 px-gutter pt-20 text-left", overlap ? "pb-24 md:pb-[120px]" : "pb-10 md:pb-16")}>
        {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>}
        <h1 className="max-w-[16ch] font-display text-h1 text-balance text-on-dark">
          {title}
          {titleAccent && <span className="block text-primary">{titleAccent}</span>}
        </h1>
        {description && <p className="line-clamp-2 max-w-[52ch] text-lead text-on-dark">{description}</p>}
        {children}
      </div>
    </section>
  );
}
