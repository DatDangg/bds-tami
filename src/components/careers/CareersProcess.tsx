import { useTranslations } from "next-intl";
import { useId } from "react";
import { ArrowRight } from "@/components/icons";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { STRENGTH_ICON_COMPONENTS } from "@/components/home/strength-icons";
import type { CareersProcessStep } from "@/lib/content/careers-process";

/**
 * "Quy trình ứng tuyển — N bước đơn giản" (BL-054, Quyết định 8): đầu khối canh trái, danh sách có thứ tự; mỗi bước ô tròn icon + số 01.. + `h3` + mô tả.
 * ≥ lg một hàng, mũi tên trang trí giữa các bước; md 2 cột, < md 1 cột. 0 bước → không render (spec: trống thì ẩn khối). Server Component.
 */
export function CareersProcess({ steps }: { steps: readonly CareersProcessStep[] }) {
  const t = useTranslations("page.careers.v2");
  const headingId = useId();
  if (steps.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="bg-primary-subtle py-section-tight">
      <div className="mx-auto flex w-full max-w-container flex-col gap-10 px-gutter">
        <SectionHeading id={headingId} eyebrow={t("processEyebrow")} title={t("processTitle", { count: steps.length })} />
        <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:flex lg:gap-4">
          {steps.map((step, index) => {
            const Icon = STRENGTH_ICON_COMPONENTS[step.icon];
            return (
              <li key={`${index}-${step.icon}`} className="flex items-start gap-4 lg:min-w-0 lg:flex-1">
                <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-surface text-accent-text shadow-sm">
                  <Icon size={28} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span aria-hidden="true" className="text-small font-semibold text-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-body font-semibold text-text">{step.title}</h3>
                  {step.description && <p className="text-small text-text-secondary">{step.description}</p>}
                </div>
                {index < steps.length - 1 && <ArrowRight size={20} aria-hidden="true" className="mt-5 hidden shrink-0 text-accent-text lg:block" />}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
