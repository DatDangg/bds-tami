import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ApplyForm } from "@/components/careers/ApplyForm";
import { APPLY_FORM_DOM_ID, APPLY_FORM_HEADING_ID, ApplyFormSlot } from "@/components/careers/ApplyFormSlot";
import { JobCard } from "@/components/careers/JobCard";
import { RichText } from "@/components/content/RichText";
import { DETAIL_ASIDE_CARD_CLASS, DetailLayout } from "@/components/detail/DetailLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { ShareButtons } from "@/components/news/ShareButtons";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { formatJobSalary, hasRichText, type JobCardData, type JobDetailView } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { JobPosting } from "@/payload-types";

interface JobDetailProps {
  doc: Pick<JobPosting, "id" | "description" | "requirements" | "benefits">;
  view: JobDetailView;
  /** Ảnh hero (`pageBanners.careers` → mặc định); thiếu thì hero nền tối token cùng chiều cao. */
  heroImage?: MediaImage;
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
 * Bố cục S13 (BL-045 Q5) trên `DetailLayout`: hero thấp (ảnh banner Tuyển dụng, eyebrow, tên vị trí, "nơi làm · hạn nộp") + breadcrumb trên ảnh → (băng hết hạn) →
 * nền vàng nhạt, MỘT thẻ trắng nội dung (tóm tắt + Mô tả / Yêu cầu / Quyền lợi mỗi mục có eyebrow + `h2`) và thẻ trắng dính cột phải = form ứng tuyển
 * (< lg nằm sau thẻ nội dung, kèm thanh dính đáy "Ứng tuyển"). Tin hết hạn: băng thông báo, KHÔNG form/thanh dính, KHÔNG JSON-LD (kể cả breadcrumb), cột phải chỉ có
 * chia sẻ, thay vào đó gợi ý vị trí khác. Banner tư vấn cuối trang do route render sau component này. Server Component; chỉ thanh dính đáy và nút chia sẻ là client.
 */
export function JobDetail({ doc, view, heroImage, others, contact, ownPath, shareUrl, turnstileSiteKey }: JobDetailProps) {
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
  const heroDescription = [place, tCareers("deadline", { date: view.deadlineLabel })].filter(Boolean).join(" · ");
  const share = (
    <div className="flex flex-col gap-2">
      <p className="text-small text-text-muted">{tShare("label")}</p>
      <ShareButtons title={view.title} {...(shareUrl ? { url: shareUrl } : {})} />
    </div>
  );

  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        before={
          <>
            <PageHero
              size="short"
              eyebrow={tNav("careers")}
              title={view.title}
              description={heroDescription}
              {...(heroImage ? { image: heroImage } : {})}
              breadcrumb={
                <Breadcrumb
                  variant="overlay"
                  jsonLd={!view.expired}
                  items={[
                    { label: tNav("careers"), href: listPath },
                    { label: view.title, href: ownPath },
                  ]}
                />
              }
            />
            {view.expired && (
              <div role="status" className="mx-auto mt-6 w-full max-w-container px-gutter">
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
          </>
        }
        {...(view.expired ? {} : { asideLabelledBy: APPLY_FORM_HEADING_ID })}
        aside={
          <div className={cn("flex flex-col gap-6", DETAIL_ASIDE_CARD_CLASS)}>
            {view.expired ? (
              share
            ) : (
              <ApplyFormSlot {...(contact.email ? { email: contact.email } : {})} {...(contact.hotline ? { hotline: contact.hotline } : {})}>
                <ApplyForm
                  jobPostingId={doc.id}
                  listPath={listPath}
                  {...(turnstileSiteKey ? { turnstileSiteKey } : {})}
                  {...(contact.hotline ? { hotline: contact.hotline } : {})}
                />
              </ApplyFormSlot>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-10">
          <section aria-labelledby="job-summary-title" className="flex flex-col gap-5">
            <h2 id="job-summary-title" className="font-display text-h3">
              {t("summaryTitle")}
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-3">
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
            {!view.expired && share}
          </section>
          {sections.map((key, index) => (
            <section key={key} aria-labelledby={`job-${key}`} className="flex flex-col gap-4 border-t border-border pt-10">
              <SectionHeading id={`job-${key}`} eyebrow={t("sectionLabel", { number: index + 1 })} title={t(`sections.${key}`)} />
              <RichText data={doc[key]} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
            </section>
          ))}
        </div>
      </DetailLayout>
      {view.expired && others.length > 0 && (
        <section aria-labelledby="other-jobs" className="bg-surface py-section-tight">
          <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter">
            <SectionHeading id="other-jobs" title={t("otherTitle")} />
            <ul className="grid gap-4">
              {others.map((card) => (
                <li key={card.id}>
                  <JobCard data={card} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <ClickRefMarker collection="job-postings" id={doc.id} />
      {!view.expired && <ProjectStickyCta targetId={APPLY_FORM_DOM_ID} label={t("stickyApply")} />}
    </article>
  );
}
