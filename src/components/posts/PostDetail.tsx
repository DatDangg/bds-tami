import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { RichText } from "@/components/content/RichText";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Gallery } from "@/components/media/Gallery";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { publicPath } from "@/lib/content/content-paths";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import type { PostCardData, PostDetailView, PostOfferView } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import type { PropertyPost } from "@/payload-types";
import { OfferBox } from "./OfferBox";
import { PostCard } from "./PostCard";
import { PostShare, PostShareRail } from "./PostShare";

interface PostDetailProps {
  doc: Pick<PropertyPost, "id" | "content">;
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
 * Bố cục S09: breadcrumb → đầu bài (danh mục, `h1`, ngày, chia sẻ) → ảnh bìa 16:9 → [khối ưu đãi] → nội dung richText (68ch) → thư viện ảnh
 * → vùng form lead (`LeadFormSlot` + `LeadForm source=property_post`; tiêu đề giống nhau cho mọi trạng thái, kể cả ưu đãi đã kết thúc) →
 * bài liên quan. Chia sẻ chỉ một cụm, ở đầu bài (không lặp cuối bài): < sm nút Web Share, sm–<xl hàng ngang (`PostShare`); ≥ xl rail
 * icon dính lề trái cột chữ (`PostShareRail`) trong wrapper `relative` bao đầu bài → hết thư viện ảnh nên không đè form lead/bài liên quan.
 * `h1` duy nhất là tiêu đề. Server Component; chỉ thư viện ảnh, chia sẻ, nút sao chép mã là client.
 */
export function PostDetail({ doc, view, offer, related, hotline, ownPath, shareUrl }: PostDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.posts");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const turnstileSiteKey = readTurnstileSiteKey();
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
      <div className="relative">
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
          <PostShare title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
        </header>
        {/* Rail sau <header> trong DOM (Tab gặp tiêu đề trước); `absolute inset-y-0` nên vẫn dính từ đầu bài. */}
        <PostShareRail {...(shareUrl ? { url: shareUrl } : {})} />
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
      </div>
      <div className="mx-auto w-full max-w-text px-gutter pb-10">
        <LeadFormSlot title={t("leadForm.title")}>
          <div className="flex flex-col gap-4">
            <LeadForm source="property_post" sourceId={doc.id} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
            {hotline && (
              <a href={hotline.telHref} className="inline-flex min-h-11 w-fit items-center font-semibold text-accent-text hover:underline">
                {t("leadForm.hotline")}: {hotline.label}
              </a>
            )}
          </div>
        </LeadFormSlot>
      </div>
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
