import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { CareersCvBanner } from "@/components/careers/CareersCvBanner";
import { CareersPerks } from "@/components/careers/CareersPerks";
import { CareersProcess } from "@/components/careers/CareersProcess";
import { JobFilters } from "@/components/careers/JobFilters";
import { JobRow } from "@/components/careers/JobRow";
import { ArrowRight } from "@/components/icons";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHero } from "@/components/layout/PageHero";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider, PendingLink, PendingRegion } from "@/components/layout/PendingRegion";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { buildContact } from "@/components/layout/shell-data";
import { buttonVariants } from "@/components/ui/button";
import { hasJobFilterParams, jobQueryString, parseJobFilters, type RawJobParams } from "@/lib/careers/job-filters";
import { findJobCategoryBySlug, listChildJobCategories, listOpenJobs, listRootJobCategories } from "@/lib/careers/job-queries";
import { toJobCards } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadCareersPerks } from "@/lib/content/load-careers-perks";
import { loadCareersProcess } from "@/lib/content/load-careers-process";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { visibleCategory } from "@/lib/news/news-view";
import { listProvinces } from "@/lib/projects/project-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

interface JobListPageProps {
  locale: Locale;
  searchParams: RawJobParams;
}

/** Neo của khối "Vị trí đang tuyển" (nút hero "Xem vị trí đang tuyển" trỏ tới, chạy không JS). */
const OPEN_POSITIONS_ID = "open-positions";

/** Danh mục đang lọc bằng `?category=`: slug, id chip cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
interface CategoryContext {
  slug: string;
  rootId: string;
  filterIds: string[];
}

interface JobChip {
  label: string;
  href: string;
  current?: boolean;
}

async function loadCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findJobCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Danh mục cấp 1 gồm cả vị trí của danh mục con; cấp 2 không có con và chip được đánh dấu là danh mục cha của nó.
  const children = parent ? [] : (await listChildJobCategories(payload, locale, category.id)).docs;
  return { slug, rootId: parent?.id ?? category.id, filterIds: [category.id, ...children.map((child) => child.id)] };
}

/** Chip phòng ban: "Tất cả" + danh mục cấp 1, link `?category=` giữ tỉnh + từ khoá đang lọc và về trang 1. Không có danh mục nào → không có hàng chip. */
function buildChips(roots: Category[], listPath: string, allLabel: string, carry: { province?: string; q?: string }, currentRootId?: string): JobChip[] {
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

/** Hàng chip phòng ban: < sm cuộn ngang (scroll-snap, mép phải mờ báo còn chip), ≥ sm xuống dòng. `pr-8` chừa chỗ cho mép mờ; `py-1 -my-1` để vòng focus không bị cắt. */
function ChipRow({ chips, label }: { chips: JobChip[]; label: string }) {
  if (chips.length === 0) return null;
  return (
    <nav aria-label={label} className="min-w-0">
      <ul className="-my-1 flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto py-1 pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:mask-none sm:flex-wrap sm:overflow-visible sm:pr-0">
        {chips.map((chip) => (
          <li key={chip.href} className="shrink-0 snap-start sm:shrink">
            <PendingLink
              href={chip.href}
              aria-current={chip.current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-pill border px-5 text-small font-semibold whitespace-nowrap shadow-sm transition-colors sm:whitespace-normal",
                chip.current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-text hover:border-accent-text",
              )}
            >
              {chip.label}
            </PendingLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Email nhận CV (trạng thái trống + banner "Gửi CV ngay"). Global lỗi (DB tắt lúc `next build`) thì không có email, trang vẫn dựng (cùng cách `load-shell`). */
async function loadContactEmail(locale: Locale): Promise<string | undefined> {
  try {
    return buildContact(await getSiteSettings(locale)).email;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho email tuyển dụng");
    return undefined;
  }
}

/** Panel trống không có bộ lọc (design-spec S12): "Hiện TAMI chưa có vị trí đang tuyển." + "Gửi CV tới <email>" (chỉ khi có email). */
function NoJobsPanel({ title, description, mailto }: { title: string; description: string; mailto?: { email: string; label: string } }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-4 py-section-tight text-center">
      <h3 className="text-h3 font-semibold">{title}</h3>
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
 * Dữ liệu + bố cục `/tuyen-dung` (BL-054, design `tuyen-dung.webp`; lọc `?category=&province=&q=&page=`): hero ảnh (breadcrumb, eyebrow, `h1`, mô tả,
 * nút neo "Xem vị trí đang tuyển") → "Môi trường để bạn phát triển" (`careersPerks`, ẩn khi < 2 mục) → "Vị trí đang tuyển" `#open-positions` (chip phòng ban,
 * ô khu vực + tìm tên vị trí, "N vị trí", hàng `JobRow`, phân trang) → "Quy trình ứng tuyển" (`careersProcess`, ẩn khi rỗng) → banner "Gửi CV ngay"
 * → banner tư vấn (giữ dù design không vẽ). CHỈ vị trí còn hạn (`listOpenJobs`: `deadline >= hôm nay giờ VN`). Slug danh mục/tỉnh lạ bị bỏ qua (danh sách
 * không lọc, không 404); trang vượt số trang → `notFound()`. Đọc `searchParams` nên render theo request (không ISR); CDN giữ theo `Cache-Control`.
 */
export async function JobListPage({ locale, searchParams }: JobListPageProps) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseJobFilters(searchParams);
  const payload = await getPayload({ config });
  const [context, provinces, t, tv, tNav, roots, hero, perks, steps, email] = await Promise.all([
    filters.categorySlug ? loadCategoryContext(payload, locale, filters.categorySlug) : null,
    listProvinces(payload),
    getTranslations({ locale, namespace: "page.careers" }),
    getTranslations({ locale, namespace: "page.careers.v2" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    listRootJobCategories(payload, locale),
    loadPageHero(locale, "careers"),
    loadCareersPerks(locale),
    loadCareersProcess(locale),
    loadContactEmail(locale),
  ]);
  const province = provinces.find((item) => item.slug === filters.provinceSlug);
  const now = new Date();
  const listing = await listOpenJobs(payload, locale, {
    page,
    now,
    ...(context ? { categoryIds: context.filterIds } : {}),
    ...(province ? { provinceId: province.id } : {}),
    ...(filters.q ? { q: filters.q } : {}),
  });
  if (page > 1 && page > listing.totalPages) notFound();

  const listPath = publicPath("/tuyen-dung", locale);
  const carry = { ...(province ? { province: province.slug } : {}), ...(filters.q ? { q: filters.q } : {}) };
  const filtersActive = Boolean(province || context || filters.q);
  const buildHref = (target: number) => `${listPath}${jobQueryString({ ...(context ? { category: context.slug } : {}), ...carry, page: target })}`;

  return (
    <>
      <PageHero
        size="list"
        overlap={false}
        title={hero.title}
        {...(hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {})}
        {...(hero.description ? { description: hero.description } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={[{ label: tNav("careers"), href: listPath }]} />}
      >
        <a href={`#${OPEN_POSITIONS_ID}`} className={cn(buttonVariants({ variant: "primary" }), "mt-3")}>
          {tv("heroCta")}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </PageHero>
      {perks && <CareersPerks perks={perks} />}
      <section id={OPEN_POSITIONS_ID} aria-labelledby="open-jobs-heading" className="scroll-mt-24 bg-bg py-section-tight">
        <ListPendingProvider>
          <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-gutter">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <SectionHeading id="open-jobs-heading" eyebrow={tv("jobsEyebrow")} title={tv("jobsTitle")} />
              {listing.totalDocs > 0 && (
                <p role="status" aria-live="polite" className="text-small text-text-secondary">
                  {tv("positionCount", { count: listing.totalDocs })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <ChipRow chips={buildChips(roots.docs, listPath, t("all"), carry, context?.rootId)} label={t("categoriesLabel")} />
              <JobFilters
                actionPath={listPath}
                provinces={provinces.map((item) => ({ slug: item.slug, name: item.shortName || item.name }))}
                {...(province ? { selectedProvince: province.slug } : {})}
                {...(filters.q ? { keyword: filters.q } : {})}
                {...(context ? { hiddenCategory: context.slug } : {})}
                // Hết kết quả thì nút xoá nằm ở EmptyState (tránh hai link trùng tên liền nhau).
                active={filtersActive && listing.totalDocs > 0}
              />
            </div>
            <PendingRegion className="flex flex-col gap-8">
              {listing.totalDocs === 0 ? (
                filtersActive ? (
                  <EmptyState variant="filtered" title={t("emptyTitle")} clearFiltersHref={listPath} />
                ) : (
                  <NoJobsPanel
                    title={t("noJobs")}
                    description={t("noJobsDescription")}
                    {...(email ? { mailto: { email, label: t("sendCv", { email }) } } : {})}
                  />
                )
              ) : (
                <>
                  <ul aria-label={t("listLabel")} className="grid gap-3">
                    {toJobCards(listing.docs, locale, now).map((card) => (
                      <li key={card.id}>
                        <JobRow data={card} headingLevel="h3" />
                      </li>
                    ))}
                  </ul>
                  <Pagination page={page} totalPages={listing.totalPages} buildHref={buildHref} />
                </>
              )}
            </PendingRegion>
          </div>
        </ListPendingProvider>
      </section>
      <CareersProcess steps={steps} />
      <CareersCvBanner {...(email ? { email } : {})} {...(hero.image ? { image: hero.image } : {})} />
      <ConsultBanner locale={locale} />
    </>
  );
}

/**
 * `generateMetadata` của `/tuyen-dung`. Có tham số lọc / tìm (`?category=`, `province`, `q`) → `noindex, follow` và canonical về trang sạch;
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
