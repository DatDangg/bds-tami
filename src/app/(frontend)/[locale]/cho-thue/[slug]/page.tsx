import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { buildContact } from "@/components/layout/shell-data";
import { RentalDetail } from "@/components/rentals/RentalDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadListingStrengths } from "@/lib/content/load-listing-strengths";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { populatedMedia } from "@/lib/news/news-view";
import { lexicalPlainText } from "@/lib/news/read-time";
import { findActiveSaleContact, findPublicRentalBySlug, findRentalPrivateFields, findSimilarRentals } from "@/lib/rentals/rental-queries";
import { toRentalCards, toRentalDetailView, toSaleContactView } from "@/lib/rentals/rental-view";
import { buildRealEstateListingJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";
import type { Media, Rental } from "@/payload-types";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Số ảnh đưa vào JSON-LD `image` (đủ cho Google, không phình HTML). */
const JSON_LD_IMAGE_COUNT = 5;
/** Mô tả meta mặc định (khi `seo.metaDescription` trống): đầu phần mô tả, cắt ở ranh giới từ. */
const META_DESCRIPTION_LENGTH = 160;

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ (`dynamicParams` mặc định) — thiếu hàm này
// route có tham số động bị coi là dynamic và không vào cache ISR nên `revalidatePath` của hook lưu tin không có gì để làm mới.
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadRental = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicRentalBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "rentals", doc.id);
  return { payload, doc, slugs };
});

function metaDescription(text: string): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  if (flat.length <= META_DESCRIPTION_LENGTH) return flat;
  return `${flat.slice(0, META_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`;
}

/** Ảnh đầu thư viện còn dùng được (ảnh đã bị xoá thì bỏ qua) làm ảnh OG; `null` → `buildPageMetadata` rơi về logo site. */
function firstGalleryMedia(doc: Rental): Media | null {
  return doc.gallery?.flatMap((item) => populatedMedia(item) ?? [])[0] ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadRental(locale, slug);
  if (!loaded) return {};
  const { doc, slugs } = loaded;
  const identity = await loadSiteIdentity(locale);
  const hasEnglish = doc.hasEnglish === true && Boolean(slugs.en);
  return buildPageMetadata({
    locale,
    seo: doc.seo,
    title: doc.title ?? "",
    description: metaDescription(lexicalPlainText(doc.description)),
    image: toOgImage(firstGalleryMedia(doc)),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: {
      vi: publicDetailPath(CONTENT_ROUTES.rentals, "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES.rentals, "en", slugs.en) } : {}),
    },
    hasEnglish,
    // Tin đã thuê vẫn mở (200) nhưng `noindex, follow` để không cạnh tranh với tin còn trống (BR-01, design-spec S07).
    forceNoindex: doc.status === "rented",
  });
}

/** Hotline chung (thay cho sale bị khoá + dự phòng khi chưa có form). Global lỗi (DB tắt lúc `next build`) thì không có hotline, trang vẫn dựng. */
async function loadHotline(locale: Locale) {
  try {
    return buildContact(await getSiteSettings(locale)).hotline;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho trang chi tiết cho thuê");
    return undefined;
  }
}

/**
 * S07 Chi tiết tin cho thuê. ISR (`revalidate = 60` từ layout; lưu tin gọi `revalidatePath`). Không có / chưa công khai / thiếu bản EN → 404 (chặn sớm
 * ở proxy cho nội dung SSR đầy đủ, `resolve-missing-page.ts`; `notFound()` là lưới an toàn); slug cũ → 301 ở proxy. Tin `rented` VẪN mở: băng + badge
 * "Đã thuê", `noindex, follow`, KHÔNG JSON-LD `RealEstateListing`, tin tương tự nổi bật. Người phụ trách và toạ độ (khách không đọc được qua access) đọc server-side
 * chỉ để dựng sale/bản đồ gần đúng; toạ độ thật không vào HTML (xem `toRentalDetailView`).
 */
export default async function RentalDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadRental(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const [similarDocs, hotline, identity, privateFields, strengths] = await Promise.all([
    findSimilarRentals(payload, locale, doc),
    loadHotline(locale),
    loadSiteIdentity(locale),
    findRentalPrivateFields(payload, doc.id),
    loadListingStrengths(locale, "rentals"),
  ]);
  const tContact = await getTranslations({ locale, namespace: "page.rentalDetail.contact" });
  const sale = toSaleContactView(await findActiveSaleContact(payload, locale, privateFields.authorId));
  const view = toRentalDetailView(doc, locale, privateFields.location);
  const ownPath = publicDetailPath(CONTENT_ROUTES.rentals, locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl(ownPath, siteUrl);
  const imageUrls = view.gallery.slice(0, JSON_LD_IMAGE_COUNT).flatMap((image) => {
    const url = absoluteUrl(image.sizes?.large?.url ?? image.url ?? "", siteUrl);
    return url ? [url] : [];
  });
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <RentalDetail
        doc={doc}
        view={view}
        similar={toRentalCards(similarDocs, locale)}
        sale={sale}
        {...(hotline ? { hotline } : {})}
        ownPath={ownPath}
        strengths={strengths}
        consultBanner={<ConsultBanner locale={locale} actionHref="#lead-form" {...(hotline ? { secondary: { label: tContact("callHotline", { phone: hotline.label }), href: hotline.telHref } } : {})} />}
      />
      {!view.rented && pageUrl && siteUrl && (
        <JsonLd
          data={buildRealEstateListingJsonLd({
            locale,
            name: view.title,
            url: pageUrl,
            description: metaDescription(lexicalPlainText(doc.description)),
            imageUrls,
            datePosted: doc.publishedAt,
            // Khai cùng mức chi tiết với trang: số nhà chỉ khi `showExactAddress` (đã nằm sẵn trong `addressLine`).
            address: view.addressLine || null,
            price: view.priceMonthlyVnd ? { amount: view.priceMonthlyVnd, currency: "VND" } : null,
            publisher: { name: identity.siteName, siteUrl, ...(logoUrl ? { logoUrl } : {}) },
          })}
        />
      )}
    </>
  );
}
