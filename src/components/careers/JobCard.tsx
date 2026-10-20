import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatJobSalary, type JobCardData } from "@/lib/careers/job-view";
import { cn } from "@/lib/utils";

interface JobCardProps {
  data: JobCardData;
  /** Cấp heading của tên vị trí: `h2` ở danh sách cũ, `h3` ở "Vị trí đang tuyển" dưới `h2` đầu khối và "Vị trí khác" cuối trang chi tiết. */
  headingLevel?: "h2" | "h3";
}

/**
 * Thẻ Việc làm dạng hàng (mockup `.job`, BL-045): thẻ trắng bo 20px đổ bóng nhẹ; trái tên vị trí + hàng thông số (nơi làm · hình thức · lương · hạn nộp),
 * phải nút "Ứng tuyển" (< md xuống dưới). Cả hàng là MỘT link tới chi tiết (BL-034: mọi thẻ là link) nên nút chỉ là hình thức, không phải link lồng.
 * Còn ≤ 3 ngày có badge cảnh báo. Server Component.
 */
export function JobCard({ data, headingLevel = "h3" }: JobCardProps) {
  const t = useTranslations("page.careers");
  const Heading = headingLevel;
  const salary = data.salary
    ? formatJobSalary(data.salary, { from: (amount) => t("salaryFrom", { amount }), upTo: (amount) => t("salaryUpTo", { amount }) })
    : null;
  return (
    <article>
      <Link
        href={data.href}
        className="group grid min-h-11 gap-4 rounded-xl border border-border bg-surface px-6 py-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-7 md:py-6"
      >
        <div className="flex min-w-0 flex-col gap-2">
          <Heading className="font-display text-h4 transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{data.title}</Heading>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-secondary">
            {data.provinceName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} aria-hidden="true" />
                {data.provinceName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} aria-hidden="true" />
              {t(`employmentType.${data.employmentType}`)}
            </span>
            {salary && <span className="font-semibold text-text">{salary}</span>}
            <span className="inline-flex flex-wrap items-center gap-2">
              <time dateTime={data.deadlineIso}>{t("deadline", { date: data.deadlineLabel })}</time>
              {data.warningDaysLeft !== null && (
                <Badge variant="warning">{data.warningDaysLeft === 0 ? t("deadlineToday") : t("daysLeft", { count: data.warningDaysLeft })}</Badge>
              )}
            </span>
          </p>
        </div>
        <span aria-hidden="true" className={cn(buttonVariants({ variant: "primary" }), "w-fit group-hover:bg-primary-hover")}>
          {t("applyCta")}
          <ArrowRight size={18} />
        </span>
      </Link>
    </article>
  );
}
