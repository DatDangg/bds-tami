import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";

/** `id` của vùng form ứng tuyển: đích cuộn của nút "Ứng tuyển" và của thanh dính đáy mobile. */
export const APPLY_FORM_DOM_ID = "apply-form";

interface ApplyFormSlotProps {
  /** Form ứng tuyển thật (layer-7-task-04 ráp vào đây); chưa có thì hiện hướng dẫn gửi CV qua email/hotline. */
  children?: ReactNode;
  email?: string;
  hotline?: { label: string; telHref: string };
}

/**
 * Vùng chừa sẵn cho form ứng tuyển (S13; form + upload CV là layer-7-task-04). Dựng trên `LeadFormSlot` (nền `--color-primary-subtle`,
 * design-spec §3.4) với `id="apply-form"`. Chỉ render ở tin còn hạn: tin hết hạn ẩn cả vùng này. Server Component.
 */
export function ApplyFormSlot({ children, email, hotline }: ApplyFormSlotProps) {
  const t = useTranslations("page.careerDetail.applyForm");
  const tCareers = useTranslations("page.careers");
  return (
    <LeadFormSlot
      id={APPLY_FORM_DOM_ID}
      title={t("title")}
      className="scroll-mt-30 lg:scroll-mt-32"
      fallback={
        <div className="flex flex-col gap-3">
          <p className="max-w-[60ch] text-body text-text-secondary">{t("fallback")}</p>
          {email && (
            <a href={`mailto:${email}`} className="inline-flex min-h-11 w-fit items-center font-semibold text-accent-text underline underline-offset-4">
              {tCareers("sendCv", { email })}
            </a>
          )}
          {hotline && (
            <a href={hotline.telHref} className="inline-flex min-h-11 w-fit items-center font-display text-h3 text-accent-text underline underline-offset-4">
              {hotline.label}
            </a>
          )}
        </div>
      }
    >
      {children}
    </LeadFormSlot>
  );
}
