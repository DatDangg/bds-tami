import { useTranslations } from "next-intl";
import Link from "next/link";
import { JobDepartmentLine, useJobSalaryLabel } from "@/components/careers/JobRow";
import { ArrowRight, MapPin, Wallet } from "@/components/icons";
import type { JobCardData } from "@/lib/careers/job-view";

function OtherJobCard({ data }: { data: JobCardData }) {
  const salary = useJobSalaryLabel(data.salary);
  return (
    <article className="h-full">
      <Link
        href={data.href}
        className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <JobDepartmentLine categoryName={data.categoryName} isUrgent={data.isUrgent} />
        <h3 className="text-body font-semibold text-text transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <ul className="flex min-w-0 flex-col gap-2 text-small text-text-secondary">
            {data.provinceName && (
              <li className="inline-flex min-w-0 items-center gap-2">
                <MapPin size={16} aria-hidden="true" className="shrink-0 text-accent-text" />
                <span className="min-w-0">{data.provinceName}</span>
              </li>
            )}
            {salary && (
              <li className="inline-flex min-w-0 items-center gap-2">
                <Wallet size={16} aria-hidden="true" className="shrink-0 text-accent-text" />
                <span className="min-w-0">{salary}</span>
              </li>
            )}
          </ul>
          <span
            aria-hidden="true"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-text transition-colors group-hover:bg-primary"
          >
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}

interface OtherJobsProps {
  jobs: JobCardData[];
  /** `/tuyen-dung` theo ngôn ngữ (link "Xem tất cả vị trí"). */
  listPath: string;
}

/**
 * "Vị trí khác" cuối trang chi tiết tuyển dụng (BL-054, design `chi-tiet-tuyen-dung.webp`): `h2` + gạch vàng ngắn, link "Xem tất cả vị trí" bên phải, lưới ≤ 4 thẻ
 * (1 cột < sm, 2 cột sm–lg, 4 cột ≥ lg). Thẻ trắng là MỘT link: phòng ban + "Tuyển gấp", tên (`h3`), tỉnh/thành, lương, nút mũi tên trang trí.
 * Rỗng → không render. Server Component.
 */
export function OtherJobs({ jobs, listPath }: OtherJobsProps) {
  const t = useTranslations("page.jobDetail.v2");
  if (jobs.length === 0) return null;
  return (
    <section aria-labelledby="other-jobs" className="py-section-tight">
      <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col gap-3">
            <h2 id="other-jobs" className="font-display text-h2 text-balance">
              {t("otherTitle")}
            </h2>
            <span aria-hidden="true" className="h-0.5 w-12 bg-primary" />
          </div>
          <Link
            href={listPath}
            className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-text hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("viewAll")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {jobs.map((job) => (
            <li key={job.id}>
              <OtherJobCard data={job} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
