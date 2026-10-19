import Link from "next/link";
import { useId } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";

interface CtaBannerProps {
  title: string;
  description?: string;
  actionLabel: string;
  actionHref: string;
  /** Ảnh nền tuỳ chọn, hiển thị mờ 20% (trang chủ). */
  backgroundImage?: MediaImage | null;
}

/**
 * Banner CTA tối cuối trang (design-spec S01 khối 7, dùng lại ở S14): tiêu đề `h2` (trang đã có `h1`), câu phụ và MỘT nút
 * chính. Khối tối có chủ đích (tokens §0), căn giữa. Server Component; nút là link thật nên chạy không cần JS.
 */
export function CtaBanner({ title, description, actionLabel, actionHref, backgroundImage }: CtaBannerProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="theme-dark-block relative isolate overflow-hidden py-section print:hidden">
      {backgroundImage && <ResponsiveImage media={backgroundImage} sizes="100vw" decorative className="absolute inset-0 -z-10 opacity-20" />}
      <div className="mx-auto flex w-full max-w-container flex-col items-center gap-6 px-gutter text-center">
        <h2 id={headingId} className="max-w-[24ch] font-display text-h2 text-balance">
          {title}
        </h2>
        {description && <p className="max-w-[60ch] text-lead text-text-secondary">{description}</p>}
        <Button asChild size="lg" className="w-full max-w-xs sm:w-auto">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
