import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { JobDetail } from "@/components/careers/JobDetail";
import { buildContact } from "@/components/layout/shell-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { toJobPostingJsonLdInput } from "@/lib/careers/job-json-ld";
import { findOtherOpenJobs, findPublicJobBySlug } from "@/lib/careers/job-queries";
import { toJobCards, toJobDetailView } from "@/lib/careers/job-view";
import { CONTENT_ROUTES } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { lexicalPlainText } from "@/lib/news/read-time";
import { buildJobPostingJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { isPastDeadline } from "@/lib/careers/deadline";
import { routing, type Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Mô tả meta mặc định (khi `seo.metaDescription` trống): đầu phần mô tả công việc, cắt ở ranh giới từ. */
const META_DESCRIPTION_LENGTH = 160;

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ (`dynamicParams` mặc định) — thiếu hàm này
// route có tham số động bị coi là dynamic và không vào cache ISR nên `revalidatePath` của hook lưu tin không có gì để làm mới. Trang tính
// "hết hạn" lúc render theo giờ VN nên đổi trạng thái trong tối đa `revalidate = 60` giây sau nửa đêm (job `close-job-postings` chỉ là lưới an toàn).
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadJob = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicJobBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "job-postings", doc.id);
  return { payload, doc, slugs };
});

function metaDescription(text: string): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  if (flat.length <= META_DESCRIPTION_LENGTH) return flat;
  return `${flat.slice(0, META_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadJob(locale, slug);
  if (!loaded) return {};
  const { doc, slugs } = loaded;
  const identity = await loadSiteIdentity(locale);
  const hasEnglish = doc.hasEnglish === true && Boolean(slugs.en);
  return buildPageMetadata({
    locale,
    seo: doc.seo,
    title: doc.title ?? "",
    description: metaDescription(lexicalPlainText(doc.description)),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: {
      vi: publicDetailPath(CONTENT_ROUTES["job-postings"], "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES["job-postings"], "en", slugs.en) } : {}),
    },
    hasEnglish,
    // Tin hết hạn vẫn mở nhưng `noindex, follow` (SPECIFICATIONS F6, DESIGN.md §305).
    forceNoindex: isPastDeadline(doc.deadline, new Date()),
  });
}

/** Email + hotline cho vùng form. Global lỗi (DB tắt lúc `next build`) thì không có, trang vẫn dựng (cùng cách `load-shell`). */
async function loadContact(locale: Locale) {
  try {
    return buildContact(await getSiteSettings(locale));
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho trang chi tiết tuyển dụng");
    return {};
  }
}

/**
 * S13 Chi tiết tuyển dụng. ISR (`revalidate = 60` từ layout; lưu tin gọi `revalidatePath`). Không có / chưa công khai / thiếu bản EN → 404 (chặn sớm
 * ở proxy cho nội dung SSR đầy đủ, `resolve-missing-page.ts`; `notFound()` là lưới an toàn); slug cũ → 301 ở proxy. Tin quá hạn VẪN mở (200): băng
 * "hết hạn", không form, `noindex, follow`, KHÔNG JSON-LD `JobPosting` — theo SPECIFICATIONS F6; Google cũng coi trang noindex là không đủ điều kiện hiển thị việc làm,
 * nên bỏ hẳn tốt hơn để `validThrough` quá khứ.
 */
export default async function JobDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadJob(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const now = new Date();
  const view = toJobDetailView(doc, locale, now);
  const [contact, t, identity, otherDocs] = await Promise.all([
    loadContact(locale),
    getTranslations({ locale, namespace: "page.careerDetail.sections" }),
    loadSiteIdentity(locale),
    view.expired ? findOtherOpenJobs(payload, locale, doc.id, now) : [],
  ]);
  const ownPath = publicDetailPath(CONTENT_ROUTES["job-postings"], locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl(ownPath, siteUrl);
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;
  const jsonLdInput =
    !view.expired && pageUrl && siteUrl
      ? toJobPostingJsonLdInput(doc, {
          locale,
          url: pageUrl,
          hiringOrganization: { name: identity.siteName, siteUrl, ...(logoUrl ? { logoUrl } : {}) },
          headings: { description: t("description"), requirements: t("requirements"), benefits: t("benefits") },
        })
      : null;

  return (
    <>
      <JobDetail
        doc={doc}
        view={view}
        others={toJobCards(otherDocs, locale, now)}
        contact={{ ...(contact.email ? { email: contact.email } : {}), ...(contact.hotline ? { hotline: contact.hotline } : {}) }}
        ownPath={ownPath}
        {...(pageUrl ? { shareUrl: pageUrl } : {})}
      />
      {jsonLdInput && <JsonLd data={buildJobPostingJsonLd(jsonLdInput)} />}
    </>
  );
}
