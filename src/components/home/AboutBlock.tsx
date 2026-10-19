import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { RichText } from "@/components/content/RichText";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { AboutView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";

/**
 * Về TAMI (design-spec S01.2): < md tiêu đề → ảnh 4:3 → nội dung → số liệu; ≥ md lưới 12 cột, ảnh cột 1-5 (4:5), chữ cột 7-12.
 * Số liệu là MỘT hàng chữ `<dl>` (không thẻ, không icon, không đếm số). Server Component.
 */
export function AboutBlock({ block }: { block: AboutView }) {
  const tRich = useTranslations("page.richText");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="relative isolate overflow-hidden bg-bg py-section">
      <div className="mx-auto grid w-full max-w-container gap-y-6 px-gutter md:grid-cols-12 md:gap-x-10 md:gap-y-8">
        <h2 id={headingId} className="font-display text-h2 md:col-span-6 md:col-start-7 md:self-end">
          {block.title}
        </h2>
        {block.image && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-muted md:col-span-5 md:col-start-1 md:row-span-3 md:row-start-1 md:aspect-[4/5]">
            <ResponsiveImage media={block.image} sizes="(min-width: 1280px) 520px, (min-width: 768px) 42vw, 100vw" />
          </div>
        )}
        <RichText data={block.content} locale={locale} tableLabel={tRich("table")} className="text-text-secondary md:col-span-6 md:col-start-7" />
        {block.stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:col-span-6 md:col-start-7 md:flex md:flex-wrap md:gap-x-12">
            {block.stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="flex flex-col-reverse gap-1">
                <dt className="text-small text-text-muted">{stat.label}</dt>
                <dd className="font-display text-h2">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
