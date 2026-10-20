import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { RichText } from "@/components/content/RichText";
import { ArrowRight } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import type { AboutView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import { AboutVideoButton } from "./AboutVideoButton";
import { STRENGTH_ICON_COMPONENTS } from "./strength-icons";

/** Cụm ảnh (mockup BL-044): ảnh lớn bên phải, ảnh phụ đè lệch ra mép trái, thẻ chú thích dưới ảnh phụ, nút play trên dải scrim đáy ảnh lớn. */
function ImageCluster({ block }: { block: AboutView }) {
  const { image, secondaryImage, imageCaption, videoEmbedUrl, videoLabel } = block;
  if (!image) return null;
  return (
    <div className="relative lg:col-span-6 lg:row-span-2 lg:row-start-1 lg:self-center">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-muted lg:ml-auto lg:aspect-square lg:w-[66%]">
        <ResponsiveImage media={image} sizes="(min-width: 1280px) 430px, (min-width: 1024px) 34vw, 100vw" />
        {videoEmbedUrl && videoLabel && (
          <div className="absolute inset-x-0 bottom-0 bg-banner-scrim p-4">
            <AboutVideoButton embedUrl={videoEmbedUrl} label={videoLabel} />
          </div>
        )}
      </div>
      {secondaryImage && (
        <div className="absolute top-[7%] left-0 hidden aspect-square w-[36%] overflow-hidden rounded-xl bg-surface-muted shadow-md lg:block">
          <ResponsiveImage media={secondaryImage} sizes="(min-width: 1280px) 230px, 20vw" decorative />
        </div>
      )}
      {imageCaption && (
        <div className="mt-4 flex items-end justify-between gap-3 rounded-lg bg-surface p-5 shadow-md lg:absolute lg:bottom-[3%] lg:left-0 lg:mt-0 lg:w-[36%]">
          <p className="min-w-0 text-small whitespace-pre-line text-text">{imageCaption}</p>
          <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
            <ArrowRight size={16} />
          </span>
        </div>
      )}
    </div>
  );
}

/** Số liệu: ô tròn 56px chứa icon (thiếu icon → không ô), giá trị lớn + nhãn muted. Hai cột. */
function StatsList({ stats }: { stats: AboutView["stats"] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
      {stats.map((stat) => {
        const Icon = stat.icon ? STRENGTH_ICON_COMPONENTS[stat.icon] : null;
        return (
          <div key={`${stat.value}-${stat.label}`} className="flex items-center gap-4">
            {Icon && (
              <span aria-hidden="true" className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
                <Icon size={24} />
              </span>
            )}
            <div className="flex min-w-0 flex-col-reverse">
              <dt className="text-small text-text-muted">{stat.label}</dt>
              <dd className="font-display text-h2">{stat.value}</dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Về TAMI (design-spec S01.2, mockup BL-044): < lg xếp dọc (tiêu đề → cụm ảnh → nội dung → số liệu → nút); ≥ lg lưới 12 cột, cụm ảnh cột 1-6, chữ cột 7-12,
 * ảnh toà nhà trang trí mép phải từ xl. Mọi chữ do admin nhập; thiếu (vd chưa có bản EN) thì phần tử đó ẩn. Server Component; chỉ nút play là client.
 */
export function AboutBlock({ block }: { block: AboutView }) {
  const tRich = useTranslations("page.richText");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="relative isolate overflow-hidden bg-bg py-section">
      {block.decorImage && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[9%] xl:block">
          <ResponsiveImage media={block.decorImage} sizes="9vw" decorative className="absolute inset-0" />
        </div>
      )}
      <div className="mx-auto grid w-full max-w-container gap-y-6 px-gutter lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:max-w-[30rem] lg:self-end">
          {block.eyebrow && <p className="mb-3 text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{block.eyebrow}</p>}
          <h2 id={headingId} className="font-display text-h2">
            {block.title}
            {block.titleAccent && <> <span className="text-accent-text">{block.titleAccent}</span></>}
          </h2>
        </div>
        <ImageCluster block={block} />
        <div className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7 lg:row-start-2 lg:max-w-[30rem] lg:self-start">
          <RichText data={block.content} locale={locale} tableLabel={tRich("table")} className="text-text-secondary" />
          {block.stats.length > 0 && <StatsList stats={block.stats} />}
          {block.cta && (
            <div>
              <Button asChild>
                <Link href={block.cta.href}>
                  {block.cta.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
