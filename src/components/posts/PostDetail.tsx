import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { RichText } from "@/components/content/RichText";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Gallery } from "@/components/media/Gallery";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { hasRichText } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { POST_SECTION_DOM_ID, visiblePostSections } from "@/lib/posts/post-detail-sections";
import type { PostCardData, PostDetailView, PostOfferView } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import type { PropertyPost } from "@/payload-types";
import { OfferBox } from "./OfferBox";
import { POST_CONTACT_HEADING_ID, PostContactBox } from "./PostContactBox";
import { PostCard } from "./PostCard";
import { PostShare } from "./PostShare";

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
 * Khối Tổng quan (`#overview`, luôn có, đầu thẻ trắng): danh mục, `h1` duy nhất (cũng là nhãn khối), ngày đăng, chia sẻ.
 * Không dùng `DetailSection` vì không có `h2` "Tổng quan" hiển thị.
 */
function PostOverview({ view, shareUrl }: Pick<PostDetailProps, "view" | "shareUrl">) {
  return (
    <section
      id={POST_SECTION_DOM_ID.overview}
      tabIndex={-1}
      aria-labelledby="post-title"
      className="flex scroll-mt-[calc(var(--sticky-top)+4.5rem)] flex-col gap-4 focus:outline-none not-last:pb-section-tight"
    >
      {view.category && (
        <Link href={view.category.href} className="inline-flex min-h-11 w-fit items-center text-small font-semibold text-accent-text transition-colors hover:text-text">
          {view.category.label}
        </Link>
      )}
      <h1 id="post-title" className="font-display text-h2 text-balance">
        {view.title}
      </h1>
      {view.publishedAtLabel && view.publishedAtIso && (
        <p className="text-small text-text-muted">
          <time dateTime={view.publishedAtIso}>{view.publishedAtLabel}</time>
        </p>
      )}
      <PostShare title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
    </section>
  );
}

/**
 * Bố cục S09 qua `DetailLayout` dùng chung với chi tiết dự án/cho thuê: breadcrumb → ảnh bìa 16:9 bo 20px (ảnh LCP) → thanh mục con dính (Tổng quan · Ưu đãi ·
 * Nội dung · Hình ảnh, khối trống tự ẩn) → lưới 2 cột ≥ lg (MỘT thẻ trắng nội dung + thẻ liên hệ dính; < lg thẻ liên hệ sau thẻ nội dung) → bài liên quan.
 * Chia sẻ một cụm trong Tổng quan: < sm nút Web Share, ≥ sm hàng ngang. `h1` duy nhất là tiêu đề. Server Component; chỉ thư viện ảnh, thanh mục
 * con, chia sẻ, nút sao chép mã, thanh dính đáy là client.
 */
export function PostDetail({ doc, view, offer, related, hotline, ownPath, shareUrl }: PostDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.posts");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const hasContent = hasRichText(doc.content);
  const sections = visiblePostSections({ hasOffer: offer !== null, hasContent, hasGallery: view.gallery.length > 0 });
  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        before={
          <>
            <Breadcrumb
              className="py-2"
              items={[
                { label: tNav("property-posts"), href: publicPath("/tin-bds", locale) },
                ...(view.parentCategory ? [view.parentCategory] : []),
                ...(view.category ? [view.category] : []),
                { label: view.title, href: ownPath },
              ]}
            />
            {view.cover && (
              <div className="mx-auto mt-4 w-full max-w-container px-gutter pb-8">
                <div className="overflow-hidden rounded-[20px]">
                  <ResponsiveImage media={view.cover} sizes="(min-width: 1280px) 1200px, 100vw" aspectRatio="16/9" priority />
                </div>
              </div>
            )}
          </>
        }
        subNav={{ items: sections.map((id) => ({ id: POST_SECTION_DOM_ID[id], label: t(`subNav.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={POST_CONTACT_HEADING_ID}
        aside={<PostContactBox postId={doc.id} {...(hotline ? { hotline } : {})} />}
        after={
          related.length > 0 ? (
            <section aria-labelledby="related-posts" className="bg-bg-alt py-section-tight">
              <div className="mx-auto w-full max-w-container px-gutter">
                <h2 id="related-posts" className="mb-8 font-display text-h2-sm">
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
          ) : null
        }
      >
        <PostOverview view={view} {...(shareUrl ? { shareUrl } : {})} />
        {offer && (
          <div id={POST_SECTION_DOM_ID.offer} tabIndex={-1} className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] border-t border-border py-section-tight focus:outline-none">
            <OfferBox offer={offer} />
          </div>
        )}
        {hasContent && (
          <DetailSection id={POST_SECTION_DOM_ID.content} title={t("sections.content")}>
            <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
          </DetailSection>
        )}
        {view.gallery.length > 0 && (
          <DetailSection id={POST_SECTION_DOM_ID.gallery} title={t("gallery")}>
            <Gallery images={view.gallery} />
          </DetailSection>
        )}
      </DetailLayout>
      <ProjectStickyCta label={t("leadForm.title")} />
    </article>
  );
}
