import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { RichText } from "@/components/content/RichText";
import { DetailGalleryHero } from "@/components/detail/DetailGalleryHero";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { DetailSection } from "@/components/detail/DetailSection";
import { DetailTitleCard } from "@/components/detail/DetailTitleCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Gallery } from "@/components/media/Gallery";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { hasRichText } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { POST_SECTION_DOM_ID, visiblePostSections } from "@/lib/posts/post-detail-sections";
import type { PostCardData, PostDetailView, PostOfferView } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import type { PropertyPost } from "@/payload-types";
import { OfferBox } from "./OfferBox";
import { OfferStatusBadge } from "./OfferStatusBadge";
import { POST_CONTACT_HEADING_ID, PostContactBox } from "./PostContactBox";
import { RelatedPosts } from "./RelatedPosts";

interface PostDetailProps {
  doc: Pick<PropertyPost, "id" | "content" | "excerpt">;
  view: PostDetailView;
  offer: PostOfferView | null;
  related: PostCardData[];
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối canonical cho nút chia sẻ (thiếu khi chưa cấu hình URL gốc). */
  shareUrl?: string;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `ProjectDetail`). */
  consultBanner?: ReactNode;
}

/** Khối Tổng quan (`#overview`, luôn có): tóm tắt bài (nếu có) + danh mục + ngày đăng. `h1` nằm ở khối tiêu đề, không ở đây. */
function PostOverview({ view, excerpt }: { view: PostDetailView; excerpt: string | null | undefined }) {
  const t = useTranslations("page.postDetail");
  const rows = [
    ...(view.category ? [{ label: t("overview.category"), value: <Link href={view.category.href} className="inline-flex min-h-11 items-center underline underline-offset-4">{view.category.label}</Link> }] : []),
    ...(view.publishedAtLabel && view.publishedAtIso ? [{ label: t("overview.publishedAt"), value: <time dateTime={view.publishedAtIso}>{view.publishedAtLabel}</time> }] : []),
  ];
  return (
    <DetailSection id={POST_SECTION_DOM_ID.overview} eyebrow={t("eyebrow.overview")} title={t("overview.title")}>
      {excerpt && <p className="mb-6 max-w-[68ch] text-body text-text-secondary">{excerpt}</p>}
      {rows.length > 0 && (
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 flex-col gap-1 border-b border-border pb-3">
              <dt className="text-small text-text-muted">{row.label}</dt>
              <dd className="font-semibold break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </DetailSection>
  );
}

/**
 * Bố cục S09 theo khung chi tiết mới (BL-045 Q4) qua `DetailLayout sectionStyle="cards"`: ảnh bìa là `DetailGalleryHero` 1 ảnh (ảnh LCP, không bộ đếm, breadcrumb kính trên ảnh) →
 * khối tiêu đề nổi `DetailTitleCard` (chứa `h1`; eyebrow danh mục, badge ưu đãi, giá + khu vực của ưu đãi nếu có, nút chia sẻ) → thanh mục con dính (Tổng quan · Ưu đãi · Nội dung · Hình ảnh,
 * khối trống tự ẩn) → lưới 2 cột ≥ lg (cột chính: các mục là thẻ trắng bo 20px; cột phải: thẻ liên hệ dính chứa form lead; < lg thẻ liên hệ sau các thẻ) → "Tin liên quan" (slider, nền trắng) → banner tư vấn.
 * `h1` duy nhất là tiêu đề. Server Component; chỉ ảnh lớn, thanh mục con, chia sẻ, nút sao chép mã, slider, thanh dính đáy là client.
 */
export function PostDetail({ doc, view, offer, related, hotline, ownPath, shareUrl, consultBanner }: PostDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.posts");
  const tDetail = useTranslations("page.postDetail");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const hasContent = hasRichText(doc.content);
  const sections = visiblePostSections({ hasOffer: offer !== null, hasContent, hasGallery: view.gallery.length > 0 });
  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        sectionStyle="cards"
        before={
          <>
            <DetailGalleryHero
              images={view.cover ? [view.cover] : []}
              breadcrumb={
                <Breadcrumb
                  variant="overlay"
                  items={[
                    { label: tNav("property-posts"), href: publicPath("/tin-bds", locale) },
                    ...(view.parentCategory ? [view.parentCategory] : []),
                    ...(view.category ? [view.category] : []),
                    { label: view.title, href: ownPath },
                  ]}
                />
              }
            />
            <DetailTitleCard
              eyebrow={view.category?.label}
              badge={offer?.badge ? <OfferStatusBadge badge={offer.badge} /> : undefined}
              title={view.title}
              location={offer?.areaLabel}
              {...(offer?.price ? { priceLabel: t("offer.price"), price: offer.price } : {})}
              shareTitle={view.title}
              {...(shareUrl ? { shareUrl } : {})}
            />
          </>
        }
        subNav={{ items: sections.map((id) => ({ id: POST_SECTION_DOM_ID[id], label: t(`subNav.${id}`) })), label: t("subNavLabel") }}
        asideLabelledBy={POST_CONTACT_HEADING_ID}
        aside={<PostContactBox postId={doc.id} {...(hotline ? { hotline } : {})} />}
        after={
          <>
            <RelatedPosts posts={related} />
            {/* Banner cuối trang: nút chính cuộn tới thẻ liên hệ (form lead duy nhất), không nhân đôi form. */}
            {consultBanner}
          </>
        }
      >
        <PostOverview view={view} excerpt={doc.excerpt} />
        {offer && (
          <DetailSection id={POST_SECTION_DOM_ID.offer} eyebrow={tDetail("eyebrow.offer")} title={t("offer.title")}>
            <OfferBox offer={offer} />
          </DetailSection>
        )}
        {hasContent && (
          <DetailSection id={POST_SECTION_DOM_ID.content} eyebrow={tDetail("eyebrow.content")} title={t("sections.content")}>
            <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
          </DetailSection>
        )}
        {view.gallery.length > 0 && (
          <DetailSection id={POST_SECTION_DOM_ID.gallery} eyebrow={tDetail("eyebrow.gallery")} title={t("gallery")}>
            <Gallery images={view.gallery} />
          </DetailSection>
        )}
      </DetailLayout>
      <ProjectStickyCta label={t("leadForm.title")} />
    </article>
  );
}
