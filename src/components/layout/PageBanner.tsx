import type { ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";

interface PageBannerProps {
  /** Nội dung `h1` của trang (mỗi trang đúng một `h1`). */
  title: string;
  description?: string;
  /** Có ảnh → biến thể Ảnh (chữ trắng trên scrim); không có → biến thể Chữ (design-spec §2.7). */
  image?: MediaImage;
  /** Chữ chìm phía sau tiêu đề, chỉ ở biến thể Chữ và ≥ md. */
  watermark?: string;
  /** Khu vực dưới mô tả (vd nút của trang 404). */
  children?: ReactNode;
}

/** Page banner đầu trang danh sách (design-spec §2.7). Server Component; chỉ `ResponsiveImage` là client. */
export function PageBanner({ title, description, image, watermark, children }: PageBannerProps) {
  if (image) {
    return (
      <section className="relative isolate flex h-[clamp(240px,42svh,440px)] items-center justify-center overflow-hidden bg-dark-deep">
        <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-overlay" />
        <div className="mx-auto flex w-full max-w-container flex-col items-center gap-4 px-gutter text-center text-on-dark">
          <h1 className="font-display text-h1 uppercase">{title}</h1>
          {description && <p className="max-w-[60ch] text-lead text-on-dark-muted">{description}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt py-section-tight">
      {watermark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 hidden -translate-y-1/2 text-center font-display text-watermark text-accent-display/10 uppercase select-none md:block"
        >
          {watermark}
        </span>
      )}
      <div className="mx-auto flex w-full max-w-container flex-col gap-4 px-gutter">
        <h1 className="font-display text-h1 uppercase">{title}</h1>
        {description && <p className="max-w-[60ch] text-lead text-text-secondary">{description}</p>}
        {children}
      </div>
    </section>
  );
}
