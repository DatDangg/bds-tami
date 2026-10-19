import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { formatJobSalary, type JobCardData } from "@/lib/careers/job-view";

interface JobCardProps {
  data: JobCardData;
  /** Cấp heading của tên vị trí: `h2` ở danh sách (ngay dưới `h1`), `h3` ở "Vị trí khác" cuối trang chi tiết (sau `h2`). */
  headingLevel?: "h2" | "h3";
}

/**
 * Thẻ Việc làm dạng hàng (design-spec §3.2, S12): < md xếp dọc (tên → nơi làm · hình thức → lương → hạn nộp, không mũi tên); ≥ md một hàng
 * lưới cột cố định (tên · nơi làm · lương · hạn nộp · mũi tên) để các hàng thẳng cột. Cả hàng là MỘT link; còn ≤ 3 ngày có badge cảnh báo.
 * Server Component.
 */
export function JobCard({ data, headingLevel = "h2" }: JobCardProps) {
  const t = useTranslations("page.careers");
  const Heading = headingLevel;
  const place = [data.provinceName, t(`employmentType.${data.employmentType}`)].filter(Boolean).join(" · ");
  const salary = data.salary
    ? formatJobSalary(data.salary, { from: (amount) => t("salaryFrom", { amount }), upTo: (amount) => t("salaryUpTo", { amount }) })
    : null;
  return (
    <article>
      <Link
        href={data.href}
        className="group flex min-h-11 flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:grid md:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem_1.25rem] md:items-center md:gap-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_12rem_11rem_10rem_1.25rem]"
      >
        <Heading className="font-display text-h3 text-balance group-hover:underline group-hover:underline-offset-4">{data.title}</Heading>
        <p className="text-small text-text-secondary">{place}</p>
        {salary ? <p className="text-small font-semibold">{salary}</p> : <span aria-hidden="true" className="hidden md:block" />}
        <p className="flex flex-wrap items-center gap-2 text-small text-text-secondary">
          <time dateTime={data.deadlineIso}>{t("deadline", { date: data.deadlineLabel })}</time>
          {data.warningDaysLeft !== null && (
            <Badge variant="warning">{data.warningDaysLeft === 0 ? t("deadlineToday") : t("daysLeft", { count: data.warningDaysLeft })}</Badge>
          )}
        </p>
        <ArrowRight size={20} aria-hidden="true" className="hidden md:block" />
      </Link>
    </article>
  );
}
