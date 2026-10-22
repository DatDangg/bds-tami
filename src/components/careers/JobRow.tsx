import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Briefcase, MapPin, Wallet } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { formatJobSalary, type JobCardData } from "@/lib/careers/job-view";
import { cn } from "@/lib/utils";

/** Nhãn "Tuyển gấp" (`isUrgent`, BL-054): nền / chữ lỗi token (≥ 4.5:1). Dùng chung cho hàng danh sách, hero chi tiết, thẻ "Vị trí khác". */
export function UrgentBadge({ className }: { className?: string }) {
  const t = useTranslations("page.careers.v2");
  return (
    <Badge variant="muted" className={cn("bg-error-subtle font-semibold text-error", className)}>
      {t("urgent")}
    </Badge>
  );
}

/** Dòng phòng ban (eyebrow in hoa) + "Tuyển gấp"; cả hai trống → không render. */
export function JobDepartmentLine({ categoryName, isUrgent }: Pick<JobCardData, "categoryName" | "isUrgent">) {
  if (!categoryName && !isUrgent) return null;
  return (
    <p className="flex flex-wrap items-center gap-2">
      {categoryName && <span className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{categoryName}</span>}
      {isUrgent && <UrgentBadge />}
    </p>
  );
}

/** Lương đã định dạng của thẻ (chữ admin nhập hoặc khoảng VNĐ rút gọn); không có lương → `null`. */
export function useJobSalaryLabel(salary: JobCardData["salary"]): string | null {
  const t = useTranslations("page.careers");
  return salary ? formatJobSalary(salary, { from: (amount) => t("salaryFrom", { amount }), upTo: (amount) => t("salaryUpTo", { amount }) }) : null;
}

function Meta({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-small text-text-secondary", className)}>
      <span aria-hidden="true" className="shrink-0 text-accent-text">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

interface JobRowProps {
  data: JobCardData;
  /** Cấp heading tên vị trí (dưới `h2` "Vị trí đang tuyển" → `h3`). */
  headingLevel?: "h2" | "h3";
}

/**
 * Hàng vị trí tuyển dụng (BL-054, design `tuyen-dung.webp`): thẻ trắng; cột 1 phòng ban + "Tuyển gấp" trên tên vị trí, rồi tỉnh/thành · hình thức ·
 * lương (đậm) · "Hạn: …" (+ badge còn ≤ 3 ngày) · nút mũi tên tròn. ≥ lg một hàng 6 cột (thông số là ô lưới nhờ `lg:contents`); < lg xếp dọc, thông số
 * xuống dòng; < sm ẩn mũi tên. Cả hàng là MỘT link (không link lồng). Server Component.
 */
export function JobRow({ data, headingLevel = "h3" }: JobRowProps) {
  const t = useTranslations("page.careers");
  const tv = useTranslations("page.careers.v2");
  const Heading = headingLevel;
  const salary = useJobSalaryLabel(data.salary);
  return (
    <article>
      <Link
        href={data.href}
        className="group grid gap-3 rounded-lg border border-border bg-surface px-5 py-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_minmax(10rem,13rem)_9.5rem_auto] lg:items-center lg:gap-y-0"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <JobDepartmentLine categoryName={data.categoryName} isUrgent={data.isUrgent} />
          <Heading className="text-body font-semibold text-text transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text md:text-lead">
            {data.title}
          </Heading>
        </div>
        <span
          aria-hidden="true"
          className="row-span-2 hidden size-10 items-center justify-center self-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary-hover sm:col-start-2 sm:row-start-1 sm:inline-flex lg:col-start-6 lg:row-span-1"
        >
          <ArrowRight size={18} />
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:contents">
          {data.provinceName && (
            <Meta icon={<MapPin size={18} />} className="lg:col-start-2 lg:row-start-1">
              {data.provinceName}
            </Meta>
          )}
          <Meta icon={<Briefcase size={18} />} className="lg:col-start-3 lg:row-start-1">
            {t(`employmentType.${data.employmentType}`)}
          </Meta>
          {salary && (
            <Meta icon={<Wallet size={18} />} className="font-semibold text-text lg:col-start-4 lg:row-start-1">
              {salary}
            </Meta>
          )}
          <span className="inline-flex flex-wrap items-center gap-2 text-small text-text-secondary lg:col-start-5 lg:row-start-1">
            <time dateTime={data.deadlineIso}>{tv("deadline", { date: data.deadlineLabel })}</time>
            {data.warningDaysLeft !== null && (
              <Badge variant="warning">{data.warningDaysLeft === 0 ? t("deadlineToday") : t("daysLeft", { count: data.warningDaysLeft })}</Badge>
            )}
          </span>
        </div>
      </Link>
    </article>
  );
}
