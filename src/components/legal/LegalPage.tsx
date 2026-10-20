import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { LEGAL_PAGE_ROUTES, type LegalPageKind, publicPath } from "@/lib/content/content-paths";
import { loadPageBanner } from "@/lib/content/load-page-banner";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { collectSectionHeadings } from "@/lib/content/section-headings";
import { formatDate } from "@/lib/format";
import { loadLegalPage } from "@/lib/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";
import { TableOfContents } from "./TableOfContents";

/** Metadata trang pháp lý: hreflang `en` chỉ khi admin đã bật `hasEnglish` (bản vi và en luôn cùng `kind`, route cố định). */
export async function buildLegalMetadata(locale: Locale, kind: LegalPageKind): Promise<Metadata> {
  const doc = await loadLegalPage(locale, kind);
  if (!doc) return {};
  const identity = await loadSiteIdentity(locale);
  const route = LEGAL_PAGE_ROUTES[kind];
  const hasEnglish = doc.hasEnglish === true;
  return buildPageMetadata({
    locale,
    title: doc.title ?? "",
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: { vi: publicPath(route, "vi"), ...(hasEnglish ? { en: publicPath(route, "en") } : {}) },
    hasEnglish,
  });
}

/**
 * S16 Trang pháp lý (chính sách bảo mật / điều khoản): banner chữ gọn, "Phiên bản · Hiệu lực từ", mục lục từ `h2`, nội dung
 * 1 cột 768px. Không có bản công khai ở ngôn ngữ này (kể cả `/en` chưa duyệt) → `notFound()` (proxy đã rewrite 404 đầy đủ trước khi vào đây).
 * Server Component.
 */
export async function LegalPage({ locale, kind }: { locale: Locale; kind: LegalPageKind }) {
  const doc = await loadLegalPage(locale, kind);
  if (!doc) notFound();
  const [t, tRich, bannerImage] = await Promise.all([
    getTranslations({ locale, namespace: "page.legal" }),
    getTranslations({ locale, namespace: "page.richText" }),
    loadPageBanner(locale, "legal"),
  ]);
  const title = doc.title ?? "";
  const headings = collectSectionHeadings(doc.content);
  const versionLine = t("version", { version: doc.version, date: formatDate(doc.effectiveDate, locale) });

  return (
    <article>
      <PageHero
        size="short"
        eyebrow={t("eyebrow")}
        title={title}
        description={versionLine}
        {...(bannerImage ? { image: bannerImage } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={[{ label: title, href: publicPath(LEGAL_PAGE_ROUTES[kind], locale) }]} />}
      />
      {/* Mockup `.legal`: mục lục dính trái (≥ lg) + MỘT thẻ trắng nội dung; < lg mục lục thu gọn nằm trên thẻ nội dung. */}
      <div className="mx-auto w-full max-w-container px-gutter py-section-tight lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <TableOfContents headings={headings} />
        <div className="min-w-0 rounded-xl bg-surface p-5 md:p-8">
          <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} anchorSections className="max-w-[72ch]" />
        </div>
      </div>
    </article>
  );
}
