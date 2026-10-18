import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Gallery } from "@/components/media/Gallery";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { ShareButtons } from "@/components/news/ShareButtons";
import { publicPath } from "@/lib/content/content-paths";
import type { PostCardData, PostDetailView, PostOfferView } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import type { PropertyPost } from "@/payload-types";
import { OfferBox } from "./OfferBox";
import { PostCard } from "./PostCard";

interface PostDetailProps {
  doc: Pick<PropertyPost, "content">;
  view: PostDetailView;
  offer: PostOfferView | null;
  related: PostCardData[];
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối canonical cho nút chia sẻ (thiếu khi chưa cấu hình URL gốc). */
  shareUrl?: string;
}

/**
 * Bố cục S09: breadcrumb → đầu bài (danh mục, `h1`, ngày) → ảnh bìa 16:9 → [khối ưu đãi] → nội dung richText (68ch) → thư viện ảnh → vùng form lead
 * (`LeadFormSlot`, layer-10-task-01 ráp form `source=property_post`; tiêu đề giống nhau cho mọi trạng thái, kể cả ưu đãi đã kết thúc) → chia sẻ →
 * bài liên quan. `h1` duy nhất là tiêu đề. Server Component; chỉ thư viện ảnh, nút chia sẻ, nút sao chép mã là client.
 */
export function PostDetail({ doc, view, offer, related, hotline, ownPath, shareUrl }: PostDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.posts");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  return (
    <article>
      <Breadcrumb
        className="py-2"
        items={[
          { label: tNav("property-posts"), href: publicPath("/tin-bds", locale) },
          ...(view.parentCategory ? [view.parentCategory] : []),
          ...(view.category ? [view.category] : []),
          { label: view.title, href: ownPath },
        ]}
      />
      <header className="mx-auto flex w-full max-w-text flex-col gap-4 px-gutter pt-6 pb-8">
        {view.category && (
          <Link href={view.category.href} className="inline-flex min-h-11 w-fit items-center text-small font-semibold text-accent-text hover:underline">
            {view.category.label}
          </Link>
        )}
        <h1 className="font-display text-h1 text-balance">{view.title}</h1>
        {view.publishedAtLabel && view.publishedAtIso && (
          <p className="text-small text-text-muted">
            <time dateTime={view.publishedAtIso}>{view.publishedAtLabel}</time>
          </p>
        )}
      </header>
      {view.cover && (
        <div className="mx-auto w-full max-w-5xl sm:px-gutter">
          <ResponsiveImage media={view.cover} sizes="(min-width: 1024px) 1024px, 100vw" aspectRatio="16/9" priority />
        </div>
      )}
      <div className="mx-auto flex w-full max-w-text flex-col gap-10 px-gutter py-10">
        {offer && <OfferBox offer={offer} />}
        <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        {view.gallery.length > 0 && (
          <section aria-label={t("gallery")}>
            <Gallery images={view.gallery} />
          </section>
        )}
      </div>
      <div className="mx-auto w-full max-w-text px-gutter pb-10">
        <LeadFormSlot
          title={t("leadForm.title")}
          fallback={
            <div className="flex flex-col gap-3">
              <p className="text-body text-text-secondary">{t("leadForm.fallback")}</p>
              {hotline && (
                <a href={hotline.telHref} className="inline-flex min-h-11 w-fit items-center font-semibold text-accent-text hover:underline">
                  {t("leadForm.hotline")}: {hotline.label}
                </a>
              )}
            </div>
          }
        />
      </div>
      <footer className="mx-auto w-full max-w-text px-gutter pb-section-tight">
        <ShareButtons title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
      </footer>
      {related.length > 0 && (
        <section aria-labelledby="related-posts" className="bg-bg-alt py-section-tight">
          <div className="mx-auto w-full max-w-container px-gutter">
            <h2 id="related-posts" className="mb-8 font-display text-h2">
              {t("relatedTitle")}
            </h2>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <PostCard data={item} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
