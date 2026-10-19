import type { ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

interface PageBannerProps {
  /** Nội dung `h1` của trang (mỗi trang đúng một `h1`). */
  title: string;
  description?: string;
  /** Có ảnh → biến thể Ảnh (chữ trắng trên scrim); không có → biến thể Chữ (design-spec §2.7). */
  image?: MediaImage;
  /**
   * `compact`: trang danh sách (Cho thuê/Dự án/Tin BĐS/Tin tức/Tuyển dụng): ảnh cao CỐ ĐỊNH 240px (không CLS), mô tả tối đa 2 dòng.
   * `default` (pháp lý, liên hệ, dịch vụ, 404…): chiều cao theo viewport như trước.
   */
  size?: "default" | "compact";
  /** Chỉ có nghĩa với `compact`: chừa 3rem đáy cho băng tìm kiếm đè lên mép dưới. Trang không có băng để mặc định `false` (không đệm thừa). */
  overlap?: boolean;
  /** Khu vực dưới mô tả (vd nút của trang 404). */
  children?: ReactNode;
}

/** Page banner đầu trang danh sách (design-spec §2.7). Server Component; chỉ `ResponsiveImage` là client. */
export function PageBanner({ title, description, image, size = "default", overlap = false, children }: PageBannerProps) {
  const compact = size === "compact";
  // `data-*` để test/E2E bám vào hợp đồng bố cục thay vì chuỗi class Tailwind.
  const dataAttrs = { "data-banner-size": size, ...(compact && overlap ? { "data-banner-overlap": "true" } : {}) };
  if (image) {
    return (
      <section
        {...dataAttrs}
        className={cn("relative isolate flex items-center justify-center overflow-hidden bg-dark-deep", compact ? cn("h-60", overlap && "pb-12") : "h-[clamp(240px,42svh,440px)]")}
      >
        <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-banner-scrim" />
        <div className="mx-auto flex w-full max-w-container flex-col items-center gap-4 px-gutter text-center text-on-dark">
          <h1 className="font-display text-h1">{title}</h1>
          {description && <p className={cn("max-w-[60ch] text-lead text-on-dark", compact && "line-clamp-2")}>{description}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section
      {...dataAttrs}
      className={cn("relative isolate overflow-hidden bg-bg-alt", compact ? cn("pt-section-tight", overlap ? "pb-24" : "pb-section-tight") : "py-section-tight")}
    >
      <div className="mx-auto flex w-full max-w-container flex-col gap-4 px-gutter">
        <h1 className="font-display text-h1">{title}</h1>
        {description && <p className="max-w-[60ch] text-lead text-text-secondary">{description}</p>}
        {children}
      </div>
    </section>
  );
}
