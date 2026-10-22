import Link from "next/link";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "@/components/icons";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JoinTeamBannerProps {
  /** Link `/tuyen-dung` theo ngôn ngữ đang xem. */
  href: string;
  /** Ảnh hero trang Tuyển dụng (`pageBanners.careers` → ảnh mặc định); thiếu → nền tối token. */
  image?: MediaImage;
}

/**
 * Banner "Gia nhập TAMI HOMES" cuối trang Liên hệ (BL-054, design `lien-he`): thẻ tối bo 20px trong container, ảnh nền + scrim token,
 * eyebrow → `h2` → mô tả (i18n) bên trái, nút "Xem vị trí đang tuyển" bên phải (≥ lg; dưới lg xuống dưới chữ). Thay chỗ banner tư vấn (trang Liên hệ không có banner tư vấn — BL-045).
 */
export function JoinTeamBanner({ href, image }: JoinTeamBannerProps) {
  const t = useTranslations("page.contact.v2");
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mx-auto w-full max-w-container px-gutter print:hidden">
      <div className={cn("theme-dark-block relative isolate flex flex-col gap-6 overflow-hidden rounded-xl bg-dark-deep px-6 py-10 text-on-dark md:px-12 lg:flex-row lg:items-center lg:justify-between", image && "[&_a:focus-visible]:outline-on-dark")}>
        {image && (
          <>
            <ResponsiveImage media={image} sizes="(min-width: 1280px) 1280px, 100vw" decorative className="absolute inset-0 -z-10" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-banner-scrim" />
            {/* Nền tối dày hơn phía chữ (trái) như hero: chữ trắng đạt AA kể cả trên ảnh sáng. */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-banner-scrim to-transparent" />
          </>
        )}
        <div className="flex max-w-[44rem] flex-col gap-3">
          <p className="text-eyebrow font-semibold tracking-[0.12em] text-primary uppercase">{t("joinEyebrow")}</p>
          <h2 id={headingId} className="font-display text-h2 text-balance text-on-dark">
            {t("joinTitle")}
          </h2>
          <p className="max-w-[60ch] text-on-dark">{t("joinDescription")}</p>
        </div>
        <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
          <Link href={href}>
            {t("joinAction")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
