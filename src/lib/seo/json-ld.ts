import type { Locale } from "../../i18n/routing";

const SCHEMA_CONTEXT = "https://schema.org";
/** Tami chỉ có tin tuyển dụng tại Việt Nam (ISO 3166-1 alpha-2). */
const DEFAULT_COUNTRY = "VN";

export interface BreadcrumbEntry {
  label: string;
  /** Đường dẫn nội bộ đã có tiền tố ngôn ngữ (vd `/en/projects`). */
  href: string;
}

/**
 * JSON-LD `BreadcrumbList` (schema.org). `position` bắt đầu từ 1; URL tuyệt đối vì Google không nhận đường dẫn tương đối.
 * Mục cuối (trang hiện tại) cũng có `item` để mỗi mục đều hợp lệ.
 */
export function buildBreadcrumbJsonLd(entries: readonly BreadcrumbEntry[], siteUrl: string) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.label,
      item: new URL(entry.href, siteUrl).toString(),
    })),
  };
}

// Các builder dưới đây nhận URL ĐÃ tuyệt đối (nơi gọi dùng `absoluteUrl`); trường trống (undefined) bị bỏ khi `JSON.stringify`.

interface Localized {
  /** Ngôn ngữ nội dung → `inLanguage` (BCP 47: `vi`, `en`). */
  locale: Locale;
}

export interface OrganizationInput {
  name: string;
  siteUrl: string;
  logoUrl?: string;
  /** Fanpage, mạng xã hội. */
  sameAs?: readonly string[];
  telephone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function buildOrganizationJsonLd(input: OrganizationInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: input.name,
    url: input.siteUrl,
    logo: input.logoUrl,
    sameAs: input.sameAs?.length ? [...input.sameAs] : undefined,
    telephone: input.telephone || undefined,
    email: input.email || undefined,
    address: input.address ? { "@type": "PostalAddress", streetAddress: input.address } : undefined,
  };
}

export interface WebSiteInput extends Localized {
  name: string;
  siteUrl: string;
}

/** `WebSite` của trang chủ (đi cùng `Organization`): tên site, URL gốc theo ngôn ngữ và `inLanguage`. */
export function buildWebSiteJsonLd(input: WebSiteInput) {
  return { "@context": SCHEMA_CONTEXT, "@type": "WebSite", name: input.name, url: input.siteUrl, inLanguage: input.locale };
}

export interface RealEstateListingInput extends Localized {
  name: string;
  url: string;
  description?: string | null;
  imageUrls?: readonly string[];
  /** ISO 8601. */
  datePosted?: string | null;
  address?: string | null;
  /** Giá thuê; bỏ trống khi "liên hệ". */
  price?: { amount: number; currency: string } | null;
  /** Đơn vị đăng tin (Organization): TAMI. Bỏ trống thì không khai. */
  publisher?: { name: string; siteUrl: string; logoUrl?: string } | null;
}

export function buildRealEstateListingJsonLd(input: RealEstateListingInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "RealEstateListing",
    name: input.name,
    url: input.url,
    description: input.description || undefined,
    image: input.imageUrls?.length ? [...input.imageUrls] : undefined,
    datePosted: input.datePosted || undefined,
    inLanguage: input.locale,
    publisher: input.publisher
      ? { "@type": "Organization", name: input.publisher.name, url: input.publisher.siteUrl, logo: input.publisher.logoUrl }
      : undefined,
    contentLocation: input.address ? { "@type": "Place", address: input.address } : undefined,
    offers: input.price
      ? {
          "@type": "Offer",
          price: input.price.amount,
          priceCurrency: input.price.currency,
          // Giá thuê tính theo tháng (RentalPrice của listing).
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: input.price.amount,
            priceCurrency: input.price.currency,
            unitText: "MONTH",
          },
        }
      : undefined,
  };
}

export interface ArticleInput extends Localized {
  headline: string;
  url: string;
  description?: string | null;
  imageUrls?: readonly string[];
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  publisher: { name: string; logoUrl?: string };
}

export function buildArticleJsonLd(input: ArticleInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: input.headline,
    description: input.description || undefined,
    image: input.imageUrls?.length ? [...input.imageUrls] : undefined,
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
    author: input.authorName ? { "@type": "Person", name: input.authorName } : undefined,
    publisher: {
      "@type": "Organization",
      name: input.publisher.name,
      logo: input.publisher.logoUrl ? { "@type": "ImageObject", url: input.publisher.logoUrl } : undefined,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    inLanguage: input.locale,
  };
}

export interface ServiceInput extends Localized {
  name: string;
  url: string;
  description?: string | null;
  imageUrls?: readonly string[];
  provider: { name: string; siteUrl: string; logoUrl?: string };
}

export function buildServiceJsonLd(input: ServiceInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Service",
    name: input.name,
    description: input.description || undefined,
    url: input.url,
    image: input.imageUrls?.length ? [...input.imageUrls] : undefined,
    provider: {
      "@type": "Organization",
      name: input.provider.name,
      url: input.provider.siteUrl,
      logo: input.provider.logoUrl,
    },
    areaServed: { "@type": "Country", name: DEFAULT_COUNTRY },
    inLanguage: input.locale,
  };
}

/** Giá trị `employmentType` của schema.org/Google. */
export type JobEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY" | "INTERN" | "OTHER";

export interface JobLocationInput {
  streetAddress?: string | null;
  /** Thành phố/tỉnh; dữ liệu Tami chỉ tới cấp tỉnh nên dùng chung cho `addressLocality` và `addressRegion`. */
  province?: string | null;
}

export interface JobSalaryInput {
  /** Đơn vị tiền ISO 4217. */
  currency: string;
  minValue?: number | null;
  maxValue?: number | null;
}

export interface JobPostingInput extends Localized {
  title: string;
  url: string;
  /** HTML hoặc chữ thuần; Google chấp nhận cả hai. */
  description: string;
  datePosted: string;
  /** ISO 8601; bỏ trống nếu không có hạn. */
  validThrough?: string | null;
  employmentType?: JobEmploymentType | null;
  hiringOrganization: { name: string; siteUrl: string; logoUrl?: string };
  /** Nơi làm việc; thiếu cả hai thì `jobLocation` chỉ còn quốc gia (Google bắt buộc `jobLocation` kèm `addressCountry`). */
  location?: JobLocationInput | null;
  /** Lương theo tháng (`unitText: MONTH`); thiếu cả min và max thì bỏ `baseSalary` (không khai lương khi chỉ có chữ "Thỏa thuận"). */
  baseSalary?: JobSalaryInput | null;
}

function buildBaseSalary(salary: JobSalaryInput | null | undefined) {
  const min = typeof salary?.minValue === "number" ? salary.minValue : undefined;
  const max = typeof salary?.maxValue === "number" ? salary.maxValue : undefined;
  if (!salary || (min === undefined && max === undefined)) return undefined;
  return {
    "@type": "MonetaryAmount",
    currency: salary.currency,
    value: { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitText: "MONTH" },
  };
}

export function buildJobPostingJsonLd(input: JobPostingInput) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "JobPosting",
    title: input.title,
    url: input.url,
    description: input.description,
    datePosted: input.datePosted,
    validThrough: input.validThrough || undefined,
    employmentType: input.employmentType || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: input.hiringOrganization.name,
      sameAs: input.hiringOrganization.siteUrl,
      logo: input.hiringOrganization.logoUrl,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: input.location?.streetAddress || undefined,
        addressLocality: input.location?.province || undefined,
        addressRegion: input.location?.province || undefined,
        addressCountry: DEFAULT_COUNTRY,
      },
    },
    baseSalary: buildBaseSalary(input.baseSalary),
    inLanguage: input.locale,
  };
}

/** Nhúng JSON vào `<script>`: thay `<` để chuỗi như `</script>` trong nội dung không đóng thẻ sớm (XSS). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
