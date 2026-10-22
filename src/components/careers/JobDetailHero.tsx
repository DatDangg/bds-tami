import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { APPLY_FORM_DOM_ID } from "@/components/careers/ApplyFormSlot";
import { JobDepartmentLine, useJobSalaryLabel } from "@/components/careers/JobRow";
import { DetailShareButton } from "@/components/detail/DetailShareButton";
import { ArrowRight, Briefcase, CalendarCheck, MapPin, Wallet } from "@/components/icons";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { buttonVariants } from "@/components/ui/button";
import type { JobDetailView } from "@/lib/careers/job-view";
import { cn } from "@/lib/utils";

interface JobDetailHeroProps {
  view: JobDetailView;
  /** Ảnh Tuyển dụng (`pageBanners.careers`); thiếu thì nền sáng trơn token. */
  image?: MediaImage;
  /** Breadcrumb `variant="plain"` (chữ tối trên nền sáng). */
  breadcrumb: ReactNode;
  /** URL tuyệt đối để chia sẻ; thiếu thì nút chia sẻ dùng URL trang hiện tại. */
  shareUrl?: string;
}

function InfoItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex min-w-0 items-center gap-2 text-small text-text-secondary">
      <span aria-hidden="true" className="shrink-0 text-accent-text">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * Hero chi tiết tuyển dụng (BL-054, design `chi-tiet-tuyen-dung.webp`): ảnh Tuyển dụng phủ scrim SÁNG bằng token nền (`bg-bg` dày bên trái, nhạt dần sang
 * phải ≥ lg; < lg phủ gần kín để chữ tối luôn đạt AA) → breadcrumb → phòng ban + "Tuyển gấp" → `h1` 2 dòng (dòng 2 màu nhấn, `splitJobTitle`) → mô tả ngắn
 * (đoạn dẫn chữ thuần, toàn văn) → hàng thông tin có icon (tỉnh/thành · hình thức · lương · hạn nộp) → "Ứng tuyển ngay" (neo `#apply-form`, chạy không JS) + "Chia sẻ".
 * Tin hết hạn: không có nút ứng tuyển. Server Component; chỉ nút chia sẻ là client.
 */
export function JobDetailHero({ view, image, breadcrumb, shareUrl }: JobDetailHeroProps) {
  const t = useTranslations("page.jobDetail.v2");
  const tCareers = useTranslations("page.careers");
  const salary = useJobSalaryLabel(view.salary);
  const [line1, line2] = view.titleLines;
  return (
    <section data-hero="job-detail" className="relative isolate overflow-hidden bg-bg">
      {image && (
        <>
          <ResponsiveImage media={image} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-bg via-bg/90 to-bg/75 lg:via-bg/85 lg:to-bg/10" />
        </>
      )}
      <div className="pt-3">{breadcrumb}</div>
      <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-gutter pt-3 pb-10 md:pb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="flex min-w-0 max-w-2xl flex-col items-start gap-3">
          <JobDepartmentLine categoryName={view.categoryName} isUrgent={view.isUrgent} />
          <h1 className="font-display text-h1 text-balance text-text">
            {line1}
            {line2 && (
              <>
                {" "}
                <span className="block text-accent-display">{line2}</span>
              </>
            )}
          </h1>
          {/* Đoạn dẫn đã bỏ khỏi thân "Mô tả công việc" (C11) nên hiện toàn văn, không `line-clamp`. */}
          {view.intro && <p className="max-w-[56ch] text-body text-text-secondary">{view.intro}</p>}
          <ul aria-label={t("infoLabel")} className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3">
            {view.provinceName && <InfoItem icon={<MapPin size={20} />}>{view.provinceName}</InfoItem>}
            <InfoItem icon={<Briefcase size={20} />}>{tCareers(`employmentType.${view.employmentType}`)}</InfoItem>
            {salary && <InfoItem icon={<Wallet size={20} />}>{salary}</InfoItem>}
            <InfoItem icon={<CalendarCheck size={20} />}>
              {t.rich("deadline", { date: view.deadlineLabel, time: (chunks) => <time dateTime={view.deadlineIso}>{chunks}</time> })}
            </InfoItem>
          </ul>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {!view.expired && (
            <a href={`#${APPLY_FORM_DOM_ID}`} className={cn(buttonVariants({ variant: "primary" }))}>
              {t("applyNow")}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          )}
          <DetailShareButton title={view.title} label={t("share")} {...(shareUrl ? { url: shareUrl } : {})} />
        </div>
      </div>
    </section>
  );
}
