import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ApplyForm } from "@/components/careers/ApplyForm";
import { APPLY_FORM_DOM_ID, APPLY_FORM_HEADING_ID, ApplyFormSlot } from "@/components/careers/ApplyFormSlot";
import { JobDetailHero } from "@/components/careers/JobDetailHero";
import { OtherJobs } from "@/components/careers/OtherJobs";
import { RichText } from "@/components/content/RichText";
import { DETAIL_ASIDE_CARD_CLASS, DetailLayout } from "@/components/detail/DetailLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ClickRefMarker } from "@/components/layout/ClickRefMarker";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { ProjectStickyCta } from "@/components/projects/ProjectStickyCta";
import { buttonVariants } from "@/components/ui/button";
import { hasRichText, type JobCardData, type JobDetailView, splitDescriptionLead } from "@/lib/careers/job-view";
import { publicPath } from "@/lib/content/content-paths";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { JobPosting } from "@/payload-types";

interface JobDetailProps {
  doc: Pick<JobPosting, "id" | "description" | "requirements" | "benefits">;
  view: JobDetailView;
  /** Ảnh hero (`pageBanners.careers` → mặc định); thiếu thì hero nền sáng trơn. */
  heroImage?: MediaImage;
  /** "Vị trí khác" (≤ 4, cùng danh mục trước); rỗng → ẩn khối. */
  others: JobCardData[];
  contact: { email?: string; hotline?: { label: string; telHref: string } };
  /** Site key Turnstile (công khai) cho form ứng tuyển; thiếu thì form báo không tải được bước xác minh. */
  turnstileSiteKey?: string;
  /** Đường dẫn công khai của chính trang (mục cuối breadcrumb). */
  ownPath: string;
  /** URL tuyệt đối để chia sẻ; thiếu (chưa cấu hình URL gốc) thì nút chia sẻ dùng URL trang hiện tại. */
  shareUrl?: string;
}

const SECTION_KEYS = ["description", "requirements", "benefits"] as const;

/**
 * Danh sách trong nội dung tin (chỉ trang này, BL-054): bỏ chấm mặc định, mỗi ý có vòng tròn viền màu nhấn bên trái (trang trí, `::before`).
 * Đứng ở thẻ bọc nên thắng `ml-6 list-disc` của `RichText` (độ đặc hiệu cao hơn).
 */
const ACCENT_LIST_CLASS =
  "[&_ul]:ml-0 [&_ul]:list-none [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-3 [&_ul>li]:relative [&_ul>li]:pl-7 [&_ul>li]:before:absolute [&_ul>li]:before:top-[0.4em] [&_ul>li]:before:left-0 [&_ul>li]:before:size-3.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:border-2 [&_ul>li]:before:border-primary [&_ul>li]:before:content-['']";

/**
 * Chi tiết tuyển dụng (BL-054, design `chi-tiet-tuyen-dung.webp`) trên `DetailLayout`: hero sáng (`JobDetailHero`) → (băng hết hạn) → cột trái MỘT thẻ trắng
 * "Mô tả công việc" / "Yêu cầu" / "Quyền lợi" (`h2`; mục trống ẩn) · cột phải thẻ trắng dính = form ứng tuyển (< lg nằm sau nội dung, kèm thanh dính đáy
 * "Ứng tuyển") → "Vị trí khác". Tin hết hạn: băng thông báo, KHÔNG form / nút ứng tuyển / thanh dính, KHÔNG JSON-LD (kể cả breadcrumb); cột phải chỉ còn thẻ
 * gợi ý gửi CV + xem vị trí khác. Banner tư vấn cuối trang do route render sau component này. Server Component.
 */
export function JobDetail({ doc, view, heroImage, others, contact, ownPath, shareUrl, turnstileSiteKey }: JobDetailProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.careerDetail");
  const tv = useTranslations("page.jobDetail.v2");
  const tCareers = useTranslations("page.careers");
  const tNav = useTranslations("layout.nav.items");
  const tRich = useTranslations("page.richText");
  const listPath = publicPath("/tuyen-dung", locale);
  const sections = SECTION_KEYS.filter((key) => hasRichText(doc[key]));
  // Đoạn dẫn đã lên hero (`view.intro`) thì thân "Mô tả công việc" bỏ đoạn đó (C11); JSON-LD vẫn đọc `doc.description` đầy đủ ở route.
  const sectionContent = { description: splitDescriptionLead(doc.description).body, requirements: doc.requirements, benefits: doc.benefits };

  return (
    <article className="pb-16 lg:pb-0">
      <DetailLayout
        before={
          <>
            <JobDetailHero
              view={view}
              {...(heroImage ? { image: heroImage } : {})}
              {...(shareUrl ? { shareUrl } : {})}
              breadcrumb={
                <Breadcrumb
                  variant="plain"
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
                  <Link href={listPath} className="inline-flex min-h-11 items-center font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text">
                    {t("viewAll")}
                  </Link>
                </div>
              </div>
            )}
          </>
        }
        {...(view.expired ? {} : { asideLabelledBy: APPLY_FORM_HEADING_ID })}
        aside={
          view.expired ? (
            <div className={cn("flex flex-col gap-4", DETAIL_ASIDE_CARD_CLASS)}>
              <p className="text-body text-text-secondary">{tv("expiredCvPrompt")}</p>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 w-fit items-center font-semibold break-all text-accent-text transition-colors duration-(--duration-fast) hover:text-text">
                  {tCareers("sendCv", { email: contact.email })}
                </a>
              )}
              <Link href={listPath} className={cn(buttonVariants({ variant: "primary" }), "w-full")}>
                {tv("viewAll")}
              </Link>
            </div>
          ) : (
            <div className={DETAIL_ASIDE_CARD_CLASS}>
              <ApplyFormSlot subtitle={tv("formSubtitle")} {...(contact.email ? { email: contact.email } : {})} {...(contact.hotline ? { hotline: contact.hotline } : {})}>
                <ApplyForm
                  jobPostingId={doc.id}
                  listPath={listPath}
                  {...(turnstileSiteKey ? { turnstileSiteKey } : {})}
                  {...(contact.hotline ? { hotline: contact.hotline } : {})}
                />
              </ApplyFormSlot>
            </div>
          )
        }
        after={<OtherJobs jobs={others} listPath={listPath} />}
      >
        <div className="flex flex-col gap-10">
          {sections.map((key) => (
            <section key={key} aria-labelledby={`job-${key}`} className="flex flex-col gap-4">
              <h2 id={`job-${key}`} className="font-display text-h3">
                {tv(`sections.${key}`)}
              </h2>
              <RichText data={sectionContent[key]} locale={locale} tableLabel={tRich("table")} className={cn("max-w-[68ch] text-text-secondary", ACCENT_LIST_CLASS)} />
            </section>
          ))}
        </div>
      </DetailLayout>
      <ClickRefMarker collection="job-postings" id={doc.id} />
      {!view.expired && <ProjectStickyCta targetId={APPLY_FORM_DOM_ID} label={t("stickyApply")} />}
    </article>
  );
}
