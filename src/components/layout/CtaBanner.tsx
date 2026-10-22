import Link from "next/link";
import { useId } from "react";
import { ArrowRight } from "@/components/icons";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CtaBannerProps {
  title: string;
  /** Dòng nhỏ in hoa trên tiêu đề (vd "Gia nhập TAMI HOMES" ở `/tuyen-dung`, BL-054); không truyền → không có. */
  eyebrow?: string;
  description?: string;
  /** Nút chính: chỉ dựng khi có CẢ nhãn lẫn link (vd banner Gửi CV ẩn nút khi thiếu email tuyển dụng). */
  actionLabel?: string;
  actionHref?: string;
  /** Ảnh nền tràn viền (trang chủ): phủ scrim `--color-banner-scrim` để chữ trắng + hai nút đạt AA kể cả trên ảnh trắng tinh. */
  backgroundImage?: MediaImage | null;
  /** Nút phụ (chip viên thuốc): chỉ dựng khi có CẢ nhãn lẫn link. */
  secondaryLabel?: string;
  secondaryHref?: string;
  /** `start`: chữ + nút canh trái (banner trang chủ theo mockup BL-044); mặc định `center` (S14 dịch vụ không đổi). */
  align?: "center" | "start";
  /** `compact`: dải thấp (~290px ở 1440) + nút chính có mũi tên, như mockup trang chủ (BL-044); mặc định `default` (dịch vụ, chi tiết dự án) không đổi. */
  size?: "default" | "compact";
}

/**
 * Banner CTA cuối trang (design-spec S01 khối 7, dùng lại ở S14): tiêu đề `h2` (trang đã có `h1`), câu phụ, nút chính và nút phụ tuỳ chọn.
 * Không ảnh: khối tối (tokens §0) như cũ. Có ảnh: ảnh phủ kín khung cao cố định (không CLS, lazy, `sizes="100vw"`) + scrim; khối vẫn là
 * `.theme-dark-block` nên nút `chip` (chỉ dùng trên nền tối/scrim) đúng màu. Server Component; nút là link thật nên chạy không cần JS.
 */
export function CtaBanner({ title, eyebrow, description, actionLabel, actionHref, backgroundImage, secondaryLabel, secondaryHref, align = "center", size = "default" }: CtaBannerProps) {
  const headingId = useId();
  const isCompact = size === "compact";
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "theme-dark-block relative isolate flex flex-col justify-center overflow-hidden print:hidden",
        isCompact ? "min-h-[18rem] py-10" : "py-section",
        backgroundImage && "[&_a:focus-visible]:outline-on-dark",
        backgroundImage && !isCompact && "min-h-[26rem] supports-[height:1svh]:min-h-[clamp(26rem,60svh,40rem)]",
      )}
    >
      {backgroundImage && (
        <>
          <ResponsiveImage media={backgroundImage} sizes="100vw" decorative className="absolute inset-0 -z-10" />
          <div aria-hidden="true" data-testid="cta-scrim" className="absolute inset-0 -z-10 bg-banner-scrim" />
        </>
      )}
      <div className={cn("mx-auto flex w-full max-w-container flex-col gap-6 px-gutter", align === "start" ? "items-start text-left" : "items-center text-center")}>
        {eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>}
        <h2 id={headingId} className="max-w-[24ch] font-display text-h2 text-balance">
          {title}
        </h2>
        {/* muted (#b3b3b3) không đạt 4.5:1 trên ảnh trắng dưới scrim → trên ảnh dùng on-dark. */}
        {description && <p className={cn("max-w-[60ch] text-lead", backgroundImage ? "text-on-dark" : "text-text-secondary")}>{description}</p>}
        {((actionLabel && actionHref) || (secondaryLabel && secondaryHref)) && (
          <div className={cn("flex w-full flex-col gap-3 sm:w-auto sm:flex-row", align === "start" ? "items-start justify-start" : "items-center justify-center")}>
            {actionLabel && actionHref && (
              <Button asChild size="lg" className="w-full max-w-xs sm:w-auto">
                <Link href={actionHref}>
                  {actionLabel}
                  {isCompact && <ArrowRight size={16} aria-hidden="true" />}
                </Link>
              </Button>
            )}
            {secondaryLabel && secondaryHref && (
              <Button asChild size="lg" variant="chip" className="w-full max-w-xs sm:w-auto">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
