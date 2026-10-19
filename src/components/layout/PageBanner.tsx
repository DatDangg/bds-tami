import type { ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";

interface PageBannerProps {
  /** Nội dung `h1` của trang (mỗi trang đúng một `h1`). */
  title: string;
  description?: string;
  /** Có ảnh → biến thể Ảnh (chữ trắng trên scrim); không có → biến thể Chữ (design-spec §2.7). */
  image?: MediaImage;
  /** Khu vực dưới mô tả (vd nút của trang 404). */
  children?: ReactNode;
}

/** Page banner đầu trang danh sách (design-spec §2.7). Server Component; chỉ `ResponsiveImage` là client. */
export function PageBanner({ title, description, image, children }: PageBannerProps) {
  if (image) {
    return (
      <section className="relative isolate flex h-[clamp(240px,42svh,440px)] items-center justify-center overflow-hidden bg-dark-deep">
        <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-banner-scrim" />
        <div className="mx-auto flex w-full max-w-container flex-col items-center gap-4 px-gutter text-center text-on-dark">
          <h1 className="font-display text-h1">{title}</h1>
          {description && <p className="max-w-[60ch] text-lead text-on-dark">{description}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden bg-bg-alt py-section-tight">
      <div className="mx-auto flex w-full max-w-container flex-col gap-4 px-gutter">
        <h1 className="font-display text-h1">{title}</h1>
        {description && <p className="max-w-[60ch] text-lead text-text-secondary">{description}</p>}
        {children}
      </div>
    </section>
  );
}
