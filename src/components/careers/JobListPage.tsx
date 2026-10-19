import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { JobCard } from "@/components/careers/JobCard";
import { JobFilters } from "@/components/careers/JobFilters";
import { EmptyState } from "@/components/layout/EmptyState";
import { buildContact } from "@/components/layout/shell-data";
import { CategoryListTemplate, type CategoryChip } from "@/components/templates/CategoryListTemplate";
import { hasJobFilterParams, jobQueryString, parseJobFilters, type RawJobParams } from "@/lib/careers/job-filters";
import { findJobCategoryBySlug, listChildJobCategories, listOpenJobs, listRootJobCategories } from "@/lib/careers/job-queries";
import { toJobCards } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadPageBanner } from "@/lib/content/load-page-banner";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { visibleCategory } from "@/lib/news/news-view";
import { listProvinces } from "@/lib/projects/project-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

interface JobListPageProps {
  locale: Locale;
  searchParams: RawJobParams;
}

/** Danh mục đang lọc bằng `?category=`: slug, id chip cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
interface CategoryContext {
  slug: string;
  rootId: string;
  filterIds: string[];
}

async function loadCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findJobCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Danh mục cấp 1 gồm cả vị trí của danh mục con; cấp 2 không có con và chip được đánh dấu là danh mục cha của nó.
  const children = parent ? [] : (await listChildJobCategories(payload, locale, category.id)).docs;
  return { slug, rootId: parent?.id ?? category.id, filterIds: [category.id, ...children.map((child) => child.id)] };
}

/** Chip nhóm công việc: "Tất cả" + danh mục cấp 1, link `?category=` giữ tỉnh đang lọc và về trang 1. Không có danh mục nào → không có hàng chip. */
function buildChips(roots: Category[], listPath: string, allLabel: string, carry: { province?: string }, currentRootId?: string): CategoryChip[] {
  const named = roots.filter((root) => root.slug && root.name);
  if (named.length === 0) return [];
  return [
    { label: allLabel, href: `${listPath}${jobQueryString(carry)}`, current: currentRootId === undefined },
    ...named.map((root) => ({
      label: root.name ?? "",
      href: `${listPath}${jobQueryString({ category: root.slug ?? "", ...carry })}`,
      current: root.id === currentRootId,
    })),
  ];
}

/** Email nhận CV cho trạng thái trống. Global lỗi (DB tắt lúc `next build`) thì không có email, trang vẫn dựng (cùng cách `load-shell`). */
async function loadContactEmail(locale: Locale): Promise<string | undefined> {
  try {
    return buildContact(await getSiteSettings(locale)).email;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho trạng thái trống tuyển dụng");
    return undefined;
  }
}

/** Panel trống không có bộ lọc (design-spec S12): "Hiện TAMI chưa có vị trí đang tuyển." + "Gửi CV tới <email>" (chỉ khi có email). */
function NoJobsPanel({ title, description, mailto }: { title: string; description: string; mailto?: { email: string; label: string } }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-4 py-section-tight text-center">
      <h2 className="text-h3 font-semibold">{title}</h2>
      <p className="max-w-[60ch] text-body text-text-secondary">{description}</p>
      {mailto && (
        <a href={`mailto:${mailto.email}`} className="inline-flex min-h-11 items-center font-semibold text-accent-text underline underline-offset-4">
          {mailto.label}
        </a>
      )}
    </div>
  );
}

/**
 * Dữ liệu + bố cục S12 (`/tuyen-dung`, lọc `?category=&province=&page=`) trên `CategoryListTemplate`. CHỈ vị trí còn hạn
 * (`listOpenJobs`: `deadline >= hôm nay giờ VN`). Slug danh mục/tỉnh lạ bị bỏ qua (hiện danh sách không lọc, không 404); trang vượt số trang →
 * `notFound()`. Đọc `searchParams` nên render theo request (không ISR); CDN giữ theo `Cache-Control` của `next.config.ts`.
 */
export async function JobListPage({ locale, searchParams }: JobListPageProps) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseJobFilters(searchParams);
  const payload = await getPayload({ config });
  const [context, provinces, t, tNav, roots, bannerImage] = await Promise.all([
    filters.categorySlug ? loadCategoryContext(payload, locale, filters.categorySlug) : null,
    listProvinces(payload),
    getTranslations({ locale, namespace: "page.careers" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    listRootJobCategories(payload, locale),
    loadPageBanner(locale, "careers"),
  ]);
  const province = provinces.find((item) => item.slug === filters.provinceSlug);
  const now = new Date();
  const listing = await listOpenJobs(payload, locale, {
    page,
    now,
    ...(context ? { categoryIds: context.filterIds } : {}),
    ...(province ? { provinceId: province.id } : {}),
  });
  if (page > 1 && page > listing.totalPages) notFound();

  const listPath = publicPath("/tuyen-dung", locale);
  const carry = province ? { province: province.slug } : {};
  const filtersActive = Boolean(province || context);
  const buildHref = (target: number) => `${listPath}${jobQueryString({ ...(context ? { category: context.slug } : {}), ...carry, page: target })}`;
  const email = listing.totalDocs === 0 && !filtersActive ? await loadContactEmail(locale) : undefined;

  return (
    <CategoryListTemplate
      title={t("title")}
      description={t("description")}
      bannerImage={bannerImage}
      breadcrumb={[{ label: tNav("careers"), href: listPath }]}
      chips={buildChips(roots.docs, listPath, t("all"), carry, context?.rootId)}
      chipsLabel={t("categoriesLabel")}
      scrollChips
      toolbar={
        <JobFilters
          actionPath={listPath}
          provinces={provinces.map((item) => ({ slug: item.slug, name: item.shortName || item.name }))}
          {...(province ? { selectedProvince: province.slug } : {})}
          {...(context ? { hiddenCategory: context.slug } : {})}
          // Hết kết quả thì nút xoá nằm ở EmptyState (tránh hai link trùng tên liền nhau).
          active={filtersActive && listing.totalDocs > 0}
        />
      }
      emptyState={
        filtersActive ? (
          <EmptyState variant="filtered" title={t("emptyTitle")} clearFiltersHref={listPath} />
        ) : (
          <NoJobsPanel
            title={t("noJobs")}
            description={t("noJobsDescription")}
            {...(email ? { mailto: { email, label: t("sendCv", { email }) } } : {})}
          />
        )
      }
      parentListHref={listPath}
      isEmpty={listing.totalDocs === 0}
      pagination={{ page, totalPages: listing.totalPages, buildHref }}
    >
      <section aria-label={t("listLabel")} className="flex flex-col gap-4">
        <p role="status" aria-live="polite" className="text-small text-text-secondary">
          {t("resultCount", { count: listing.totalDocs })}
        </p>
        <ul className="flex flex-col gap-2">
          {toJobCards(listing.docs, locale, now).map((card) => (
            <li key={card.id}>
              <JobCard data={card} />
            </li>
          ))}
        </ul>
      </section>
    </CategoryListTemplate>
  );
}

/**
 * `generateMetadata` của `/tuyen-dung`. Có tham số lọc (`?category=`, `province`) → `noindex, follow` và canonical về trang sạch;
 * không lọc: canonical là chính nó (kèm `?page=n` ở trang ≥ 2). Không tra danh mục nên không lặp truy vấn của trang.
 */
export async function buildJobListMetadata({ locale, searchParams }: JobListPageProps): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = hasJobFilterParams(searchParams);
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.careers" }), loadSiteIdentity(locale)]);
  const pathFor = (target: Locale) => {
    const path = publicPath("/tuyen-dung", target);
    return !filtered && page > 1 ? `${path}?page=${page}` : path;
  };
  return buildPageMetadata({
    locale,
    siteName: identity.siteName,
    defaultImage: identity.logo,
    forceNoindex: filtered,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: true,
  });
}
