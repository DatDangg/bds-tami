import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";

/** `id` của vùng form ứng tuyển: đích cuộn của thanh dính đáy mobile và của neo `#apply-form`. */
export const APPLY_FORM_DOM_ID = "apply-form";
/** `id` tiêu đề của vùng form: nhãn cho `<aside>` của `DetailLayout`. */
export const APPLY_FORM_HEADING_ID = "apply-form-title";

interface ApplyFormSlotProps {
  /** Form ứng tuyển (`ApplyForm`); chưa có thì hiện hướng dẫn gửi CV qua email/hotline. */
  children?: ReactNode;
  email?: string;
  hotline?: { label: string; telHref: string };
  /** Dòng phụ dưới tiêu đề, cùng `<header>` với `h2` (BL-054: "Phản hồi trong 3 ngày làm việc."). */
  subtitle?: string;
}

/**
 * Vùng form ứng tuyển (S13). Dựng trên `LeadFormSlot` với `id="apply-form"` nhưng TRONG suốt, không đệm: khung thẻ trắng dính cột phải
 * (`DETAIL_ASIDE_CARD_CLASS`, BL-045 Q5) do `JobDetail` bọc. `children` là `ApplyForm`. Luôn kèm kênh dự phòng (email + hotline) dưới form để ứng viên vẫn nộp được khi
 * form lỗi; chưa có form thì chỉ hiện hướng dẫn gửi CV. Chỉ render ở tin còn hạn: tin hết hạn ẩn cả vùng này. Server Component.
 */
export function ApplyFormSlot({ children, email, hotline, subtitle }: ApplyFormSlotProps) {
  const t = useTranslations("page.careerDetail.applyForm");
  const tCareers = useTranslations("page.careers");
  const hasContact = Boolean(email || hotline);
  return (
    <LeadFormSlot
      id={APPLY_FORM_DOM_ID}
      headingId={APPLY_FORM_HEADING_ID}
      title={t("title")}
      {...(subtitle ? { subtitle } : {})}
      className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] bg-transparent p-0 lg:p-0"
    >
      <div className="flex flex-col gap-3">
        {children ?? <p className="max-w-[60ch] text-body text-text-secondary">{t("fallback")}</p>}
        {children && hasContact && <p className="mt-2 border-t border-border pt-4 text-small text-text-secondary">{t("orContact")}</p>}
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
    </LeadFormSlot>
  );
}
