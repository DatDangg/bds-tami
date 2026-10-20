import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ApplyForm } from "@/components/careers/ApplyForm";
import { ApplyFormSlot, APPLY_FORM_DOM_ID } from "@/components/careers/ApplyFormSlot";
import { JobCard } from "@/components/careers/JobCard";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { ShareButtons } from "@/components/news/ShareButtons";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { Button } from "@/components/ui/button";
import { formatJobSalary, hasRichText, type JobCardData, type JobDetailView } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import type { Locale } from "@/i18n/routing";
import type { JobPosting } from "@/payload-types";

interface JobDetailProps {
  doc: Pick<JobPosting, "id" | "description" | "requirements" | "benefits">;
  view: JobDetailView;
  /** Vị trí đang tuyển khác: chỉ dùng khi tin đã hết hạn (gợi ý thay thế). */
  others: JobCardData[];
  contact: { email?: string; hotline?: { label: string; telHref: string } };
  /** Site key Turnstile (công khai) cho form ứng tuyển; thiếu thì form báo không tải được bước xác minh. */
  turnstileSiteKey?: string;
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối để chia sẻ; thiếu (chưa cấu hình URL gốc) thì nút sao chép dùng URL trang hiện tại. */
  shareUrl?: string;
}

const SECTION_KEYS = ["description", "requirements", "benefits"] as const;

/**
 * Bố cục S13: breadcrumb → (băng hết hạn) → `h1` → 2 cột ≥ lg (nội dung 8 cột: Mô tả / Yêu cầu / Quyền lợi mỗi khối `h2`; cột phải 4 cột dính: tóm tắt
 * + nút Ứng tuyển + chia sẻ; < lg tóm tắt nằm ngay dưới tiêu đề, `dl` 2 cột) → vùng form ứng tuyển. Tin hết hạn: băng thông báo, KHÔNG có nút/vùng form/thanh
 * dính, KHÔNG có JSON-LD (kể cả breadcrumb), thay vào đó gợi ý vị trí khác. Server Component; chỉ thanh dính đáy và nút chia sẻ là client.
 */
export function JobDetail({ doc, view, others, contact, ownPath, shareUrl, turnstileSiteKey }: JobDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.careerDetail");
  const tCareers = useTranslations("page.careers");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const tShare = useTranslations("page.news.share");
  const listPath = publicPath("/tuyen-dung", locale);
  const salary = view.salary
    ? formatJobSalary(view.salary, { from: (amount) => tCareers("salaryFrom", { amount }), upTo: (amount) => tCareers("salaryUpTo", { amount }) })
    : null;
  const place = [view.workplace, view.provinceName].filter(Boolean).join(", ");
  const summary: { label: string; value: string }[] = [
    ...(place ? [{ label: t("location"), value: place }] : []),
    { label: t("employmentType"), value: tCareers(`employmentType.${view.employmentType}`) },
    ...(view.quantity ? [{ label: t("quantity"), value: t("quantityValue", { count: view.quantity }) }] : []),
    ...(salary ? [{ label: t("salary"), value: salary }] : []),
  ];
  const sections = SECTION_KEYS.filter((key) => hasRichText(doc[key]));

  return (
    <article className="pb-16 lg:pb-0">
      <Breadcrumb
        className="py-2"
        jsonLd={!view.expired}
        items={[
          { label: tNav("careers"), href: listPath },
          { label: view.title, href: ownPath },
        ]}
      />
      {view.expired && (
        <div role="status" className="mx-auto mt-4 w-full max-w-container px-gutter">
          <div className="flex flex-col gap-3 rounded-sm bg-warning-subtle p-4 text-warning sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{t("expiredTitle")}</p>
              <p className="text-small">{t("expiredBody")}</p>
            </div>
            <Link href={listPath} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 transition-colors hover:text-accent-text hover:no-underline">
              {t("viewAll")}
            </Link>
          </div>
        </div>
      )}
      <header className="mx-auto w-full max-w-container px-gutter pt-6 pb-8">
        <h1 className="font-display text-h1 text-balance">{view.title}</h1>
      </header>
      <div className="mx-auto grid w-full max-w-container gap-8 px-gutter pb-section-tight lg:grid-cols-12 lg:gap-12">
        <aside aria-labelledby="job-summary-title" className="lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start lg:sticky lg:top-[calc(var(--header-offset)+1rem)]">
          <div className="flex flex-col gap-6 rounded-sm bg-bg-alt p-6">
            <h2 id="job-summary-title" className="font-display text-h2-sm">
              {t("summaryTitle")}
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-1">
              {summary.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-small text-text-muted">{item.label}</dt>
                  <dd className="font-semibold break-words">{item.value}</dd>
                </div>
              ))}
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-small text-text-muted">{t("deadline")}</dt>
                <dd className="font-semibold">
                  <time dateTime={view.deadlineIso}>{view.deadlineLabel}</time>
                </dd>
              </div>
            </dl>
            {!view.expired && (
              <Button asChild size="lg" className="hidden lg:inline-flex">
                <a href={`#${APPLY_FORM_DOM_ID}`}>{t("applyCta")}</a>
              </Button>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-small text-text-muted">{tShare("label")}</p>
              <ShareButtons title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-8 lg:row-start-1">
          {sections.map((key) => (
            <section key={key} aria-labelledby={`job-${key}`} className="flex flex-col gap-4">
              <h2 id={`job-${key}`} className="font-display text-h2-sm">
                {t(`sections.${key}`)}
              </h2>
              <RichText data={doc[key]} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
            </section>
          ))}
        </div>
      </div>
      {view.expired ? (
        others.length > 0 && (
          <section aria-labelledby="other-jobs" className="bg-bg-alt py-section-tight">
            <div className="mx-auto w-full max-w-container px-gutter">
              <h2 id="other-jobs" className="mb-6 font-display text-h2-sm">
                {t("otherTitle")}
              </h2>
              <ul className="flex flex-col gap-2">
                {others.map((card) => (
                  <li key={card.id}>
                    <JobCard data={card} headingLevel="h3" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      ) : (
        <div className="bg-bg py-section-tight">
          <div className="mx-auto w-full max-w-text px-gutter">
            <ApplyFormSlot {...(contact.email ? { email: contact.email } : {})} {...(contact.hotline ? { hotline: contact.hotline } : {})}>
              <ApplyForm
                jobPostingId={doc.id}
                listPath={listPath}
                {...(turnstileSiteKey ? { turnstileSiteKey } : {})}
                {...(contact.hotline ? { hotline: contact.hotline } : {})}
              />
            </ApplyFormSlot>
          </div>
        </div>
      )}
      <ClickRefMarker collection="job-postings" id={doc.id} />
      {!view.expired && <ProjectStickyCta targetId={APPLY_FORM_DOM_ID} label={t("stickyApply")} />}
    </article>
  );
}
