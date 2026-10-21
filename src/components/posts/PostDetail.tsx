import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RichText } from "@/components/content/RichText";
import { DetailGalleryGrid } from "@/components/detail/DetailGalleryGrid";
import { DetailHeroMosaic } from "@/components/detail/DetailHeroMosaic";
import { DetailInfoGrid, type DetailInfoItem } from "@/components/detail/DetailInfoGrid";
import { DetailPageShell, type DetailBand } from "@/components/detail/DetailPageShell";
import { DetailSection } from "@/components/detail/DetailSection";
import { DetailShareButton } from "@/components/detail/DetailShareButton";
import { DetailSpecBar, type DetailSpecItem } from "@/components/detail/DetailSpecBar";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { Bed, BuildingApartment, Buildings, CalendarCheck, Clock, Compass, House, HouseLine, ClipboardText, Ruler, SquaresFour, Storefront, Tag } from "@/components/icons";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { LazyMap } from "@/components/media/LazyMap";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Badge } from "@/components/ui/badge";
import { hasRichText } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { formatNumber } from "@/lib/format";
import type { StrengthsView } from "@/lib/home/home-view";
import { POST_SECTION_DOM_ID, visiblePostSections, type PostSectionId } from "@/lib/posts/post-detail-sections";
import type { PostDetailSpecs } from "@/lib/posts/post-detail-specs";
import type { OfferBadge, PostCardData, PostDetailView, PostOfferView } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import type { PropertyPost } from "@/payload-types";
import { OfferBox } from "./OfferBox";
import { OfferStatusBadge } from "./OfferStatusBadge";
import { POST_CONTACT_HEADING_ID, PostContactBox } from "./PostContactBox";
import { RelatedPosts } from "./RelatedPosts";

const ICON_SIZE = 20;

/** Chip trên hero nền tối (`theme-dark-block`): viền sáng, chữ trắng — cùng kiểu chip danh mục của chi tiết Dự án / Cho thuê. */
const HERO_CHIP_CLASS =
  "inline-flex items-center rounded-pill border border-on-dark/50 bg-dark-deep/30 px-2.5 py-1 text-xsmall font-medium tracking-[0.06em] text-on-dark uppercase";

interface PostDetailProps {
  doc: Pick<PropertyPost, "id" | "content" | "excerpt">;
  view: PostDetailView;
  /** Trường có cấu trúc (`toPostDetailSpecs`): thanh thông số, lưới thông tin, Vị trí. */
  specs: PostDetailSpecs;
  offer: PostOfferView | null;
  related: PostCardData[];
  hotline?: { label: string; telHref: string };
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối canonical cho nút chia sẻ (thiếu khi chưa cấu hình URL gốc). */
  shareUrl?: string;
  /** Dải Điểm mạnh (cờ `listingPages.propertyPosts.showStrengths`); `null` → không dải. */
  strengths?: StrengthsView | null;
  /** Banner tư vấn cuối trang: `<ConsultBanner />` là Server Component async nên trang dựng rồi truyền vào (như `ProjectDetail`). */
  consultBanner?: ReactNode;
}

/**
 * Khối Ưu đãi có nội dung riêng (hạn, trạng thái, mã voucher, điều khoản). `toPostOfferView` còn trả view chỉ vì có giá / khu vực / liên quan — những thứ đó nay nằm ở thanh
 * thông số, hero và lưới thông tin nên không dựng mục Ưu đãi cho chúng.
 */
function hasOfferDetails(offer: PostOfferView | null): offer is PostOfferView {
  return offer !== null && (offer.ended || offer.badge !== null || offer.period !== null || offer.voucherCode !== null || offer.terms !== null);
}

/** Ảnh hero: ảnh bìa rồi thư viện (bỏ ảnh trùng URL). */
function heroImages(view: PostDetailView): MediaImage[] {
  const seen = new Set<string>();
  return [...(view.cover ? [view.cover] : []), ...view.gallery].filter((image) => {
    const key = image.url ?? "";
    if (key && seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Badge ưu đãi trên hero nền tối: "Đã kết thúc" dùng `dark` + viền sáng (biến thể `muted` mất tương phản trong `theme-dark-block`); sắp hết hạn giữ `OfferStatusBadge` (warning). */
function HeroOfferBadge({ badge }: { badge: OfferBadge }) {
  const t = useTranslations("page.posts");
  if (badge.kind === "ended") {
    return (
      <Badge variant="dark" className="border border-on-dark/40">
        {t("endedBadge")}
      </Badge>
    );
  }
  return <OfferStatusBadge badge={badge} />;
}

/** Trạng thái ưu đãi trong thanh thông số tin voucher (BR-06: hết hạn → "Đã kết thúc"). */
function useOfferStatusText(offer: PostOfferView | null): string | null {
  const t = useTranslations("page.posts");
  const tSpec = useTranslations("page.postDetail.v2.spec");
  if (!offer) return null;
  if (offer.ended) return t("endedBadge");
  if (offer.badge?.kind === "endingSoon") return offer.badge.daysLeft === 0 ? t("endsToday") : t("daysLeft", { count: offer.badge.daysLeft });
  return tSpec("offerActive");
}

/** "2 phòng ngủ · 1 WC" (phần nào có thì hiện); không có cả hai → `null` (ô bị bỏ). Dùng chung chuỗi số phòng với chi tiết Cho thuê. */
function useLayoutText({ bedrooms, bathrooms }: Pick<PostDetailSpecs, "bedrooms" | "bathrooms">): string | null {
  const t = useTranslations("page.rentalDetail.facts");
  const parts = [bedrooms !== null ? t("bedroomsValue", { count: bedrooms }) : null, bathrooms !== null ? t("bathroomsValue", { count: bathrooms }) : null].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Thanh thông số theo loại tin (BL-052): tin BĐS = Giá · Diện tích · Phòng ngủ/tắm · Hướng · Mặt tiền · Số tầng; tin voucher = Hạn ưu đãi · Trạng thái (+ Giá nếu có).
 * Ô trống bị bỏ; không ô nào → `DetailSpecBar` không dựng.
 */
function usePostSpecItems(specs: PostDetailSpecs, offer: PostOfferView | null): DetailSpecItem[] {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.postDetail.v2.spec");
  const tDirection = useTranslations("page.rentalDetail.direction");
  const layoutText = useLayoutText(specs);
  const statusText = useOfferStatusText(offer);
  const price: DetailSpecItem = { icon: <Tag size={ICON_SIZE} />, label: t("price"), value: specs.price };
  if (specs.isVoucher) {
    return [
      { icon: <CalendarCheck size={ICON_SIZE} />, label: t("offerEnd"), value: offer?.period?.endLabel ?? null },
      { icon: <Clock size={ICON_SIZE} />, label: t("offerStatus"), value: statusText },
      price,
    ];
  }
  return [
    price,
    { icon: <Ruler size={ICON_SIZE} />, label: t("area"), value: specs.area },
    { icon: <Bed size={ICON_SIZE} />, label: t("layout"), value: layoutText },
    { icon: <Compass size={ICON_SIZE} />, label: t("direction"), value: specs.direction ? tDirection(specs.direction) : null },
    { icon: <Storefront size={ICON_SIZE} />, label: t("frontage"), value: specs.frontage },
    { icon: <SquaresFour size={ICON_SIZE} />, label: t("floors"), value: specs.floors !== null ? formatNumber(specs.floors, locale) : null },
  ];
}

/**
 * Khối Tổng quan (cạnh cột liên hệ ≥ lg): eyebrow "Giới thiệu" + `h2` → nội dung bài (richText; bài cũ không có nội dung thì tóm tắt) → lưới thông tin (Loại hình, Tình trạng
 * bàn giao, danh mục, dự án / tin cho thuê liên quan là link nội bộ, ngày đăng; ô trống bị bỏ). Luôn có.
 */
function PostOverview({ doc, view, specs, offer }: Pick<PostDetailProps, "doc" | "view" | "specs" | "offer">) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.postDetail.v2");
  const tOptions = useTranslations("listingOptions");
  const tRich = useTranslations("page.richText");
  const hasContent = hasRichText(doc.content);
  const relatedTarget = (kind: "project" | "rental") => offer?.related.find((target) => target.kind === kind) ?? null;
  const project = relatedTarget("project");
  const rental = relatedTarget("rental");
  const info: DetailInfoItem[] = [
    { icon: <House size={ICON_SIZE} />, label: t("info.propertyType"), value: specs.propertyType ? tOptions(`propertyType.${specs.propertyType}`) : null },
    { icon: <HouseLine size={ICON_SIZE} />, label: t("info.handover"), value: specs.handover ? tOptions(`handoverCondition.${specs.handover}`) : null },
    { icon: <ClipboardText size={ICON_SIZE} />, label: t("info.category"), value: view.category?.label ?? null, link: view.category ? { href: view.category.href } : null },
    { icon: <Buildings size={ICON_SIZE} />, label: t("info.project"), value: project?.title ?? null, link: project ? { href: project.href } : null },
    { icon: <BuildingApartment size={ICON_SIZE} />, label: t("info.rental"), value: rental?.title ?? null, link: rental ? { href: rental.href } : null },
    { icon: <Clock size={ICON_SIZE} />, label: t("info.publishedAt"), value: view.publishedAtLabel, dateTime: view.publishedAtIso },
  ];
  return (
    <DetailSection id={POST_SECTION_DOM_ID.overview} eyebrow={t("eyebrow.overview")} title={t("titles.overview")}>
      <div className="flex flex-col gap-8">
        {hasContent ? (
          <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        ) : (
          doc.excerpt && <p className="max-w-[68ch] text-body text-text-secondary">{doc.excerpt}</p>
        )}
        <DetailInfoGrid items={info} label={t("info.label")} />
      </div>
    </DetailSection>
  );
}

/**
 * Chi tiết Tin BĐS theo khung chi tiết BL-052 (cùng `DetailPageShell` với chi tiết Dự án / Cho thuê): hero ảnh full-bleed (`DetailHeroMosaic`: ảnh bìa + thư viện làm ảnh nhỏ,
 * chip danh mục + badge ưu đãi, `h1`, địa chỉ / khu vực, tóm tắt, nút chia sẻ; không video) → thanh thông số theo loại tin → tab dính → [Tổng quan · Ưu đãi (`OfferBox`: hạn,
 * trạng thái, mã voucher + điều kiện; hết hạn → "Đã kết thúc", không mã — BR-06) | cột phải dính: form lead `source=property_post` duy nhất + hotline] → dải Vị trí (bản đồ khi
 * có toạ độ, không thì dòng địa chỉ) · Hình ảnh → "Tin liên quan" → dải Điểm mạnh → banner tư vấn. Khối trống ẩn cả khối lẫn tab. Server Component; phần tương tác (hero,
 * tab, chia sẻ, sao chép mã, bản đồ, slider, thanh dính đáy) là client.
 */
export function PostDetail({ doc, view, specs, offer, related, hotline, ownPath, shareUrl, strengths, consultBanner }: PostDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.postDetail.v2");
  const tPosts = useTranslations("page.posts");
  const tNav = useTranslations("layout.nav.items");
  const specItems = usePostSpecItems(specs, offer);
  const offerDetails = hasOfferDetails(offer) ? offer : null;
  const sections = visiblePostSections({
    hasOffer: offerDetails !== null,
    hasLocation: specs.map !== null || specs.place !== null,
    hasGallery: view.gallery.length > 0,
    hasRelated: related.length > 0,
  });

  const bandContent: Partial<Record<PostSectionId, ReactNode>> = {
    location: (
      <DetailSection id={POST_SECTION_DOM_ID.location} eyebrow={t("eyebrow.location")} title={t("titles.location")} description={specs.place}>
        {specs.map && <LazyMap location={specs.map} label={t("mapLabel", { name: view.title })} />}
      </DetailSection>
    ),
    gallery: (
      <DetailSection id={POST_SECTION_DOM_ID.gallery} eyebrow={t("eyebrow.gallery")} title={t("titles.gallery")} description={t("galleryDescription", { name: view.title })}>
        <DetailGalleryGrid images={view.gallery} />
      </DetailSection>
    ),
  };
  const bands: DetailBand[] = sections.flatMap((id) => (id === "location" || id === "gallery" ? [{ key: id, content: bandContent[id] }] : []));

  return (
    <article className="pb-16 lg:pb-0">
      <DetailPageShell
        hero={
          <DetailHeroMosaic
            images={heroImages(view)}
            title={view.title}
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
            badges={
              view.category || offer?.badge ? (
                <>
                  {view.category && <span className={HERO_CHIP_CLASS}>{view.category.label}</span>}
                  {offer?.badge && <HeroOfferBadge badge={offer.badge} />}
                </>
              ) : undefined
            }
            address={specs.place}
            summary={doc.excerpt ?? null}
            actions={
              // Nền kính tối sau nút tròn (nút dựng cho nền sáng: viền token gần như mất trên ảnh tối) — cùng kiểu nút "Xem tất cả ảnh" của hero.
              <span className="rounded-full bg-dark-deep/40 backdrop-blur-sm">
                <DetailShareButton title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
              </span>
            }
          />
        }
        specBar={<DetailSpecBar items={specItems} label={t("spec.label")} />}
        subNav={{ items: sections.map((id) => ({ id: POST_SECTION_DOM_ID[id], label: t(`tabs.${id}`) })), label: tPosts("subNavLabel") }}
        asideLabelledBy={POST_CONTACT_HEADING_ID}
        aside={<PostContactBox postId={doc.id} {...(hotline ? { hotline } : {})} />}
        bands={bands}
        after={
          <>
            <RelatedPosts posts={related} id={POST_SECTION_DOM_ID.related} />
            {strengths && <StrengthsBlock block={strengths} />}
            {/* Banner cuối trang: nút chính cuộn tới form ở cột phải (form lead duy nhất), không nhân đôi form. */}
            {consultBanner}
          </>
        }
      >
        <PostOverview doc={doc} view={view} specs={specs} offer={offer} />
        {offerDetails && (
          <DetailSection id={POST_SECTION_DOM_ID.offer} eyebrow={t("eyebrow.offer")} title={tPosts("offer.title")}>
            {/* Giá / khu vực / dự án liên quan đã ở thanh thông số, hero và lưới thông tin: hộp ưu đãi chỉ còn hạn, trạng thái, mã voucher, điều khoản. */}
            <OfferBox offer={{ ...offerDetails, price: null, areaLabel: null, related: [] }} />
          </DetailSection>
        )}
      </DetailPageShell>
      <ProjectStickyCta label={tPosts("leadForm.title")} />
    </article>
  );
}
