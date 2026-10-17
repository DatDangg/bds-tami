import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageBanner } from "@/components/layout/PageBanner";
import { LEGAL_PAGE_ROUTES, type LegalPageKind, publicPath } from "@/lib/content/content-paths";
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
  const [t, tRich] = await Promise.all([getTranslations({ locale, namespace: "page.legal" }), getTranslations({ locale, namespace: "page.richText" })]);
  const title = doc.title ?? "";
  const headings = collectSectionHeadings(doc.content);
  const versionLine = t("version", { version: doc.version, date: formatDate(doc.effectiveDate, locale) });

  return (
    <article>
      <PageBanner title={title} description={versionLine} />
      <Breadcrumb className="py-2" items={[{ label: title, href: publicPath(LEGAL_PAGE_ROUTES[kind], locale) }]} />
      <div className="mx-auto w-full max-w-container px-gutter py-10 xl:grid xl:grid-cols-[15rem_minmax(0,48rem)] xl:justify-center xl:gap-12">
        <TableOfContents headings={headings} />
        <div className="min-w-0">
          <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} anchorSections />
        </div>
      </div>
    </article>
  );
}
