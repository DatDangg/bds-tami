"use client";

import { useTranslations } from "next-intl";
import { useId, type FormEvent } from "react";
import { ArrowRight, EnvelopeSimple } from "@/components/icons";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormField } from "@/components/forms/FormField";
import { FormErrorSummary, FormStatus } from "@/components/forms/FormStatus";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { usePublicForm, type FormFields } from "@/components/forms/use-public-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ENDPOINT = "/api/public/newsletter";
const FIELD_NAMES = ["email"] as const;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_CHARS = 254;

interface NewsletterSignupProps {
  /** Site key Turnstile (công khai), như `LeadForm`; thiếu thì form báo không tải được bước xác minh khi gửi. */
  turnstileSiteKey?: string;
  className?: string;
}

/**
 * Thẻ "Bản tin thị trường" (BL-054, cột phải `/tin-tuc`): nền tối token (`theme-dark-block`), email + đồng ý nhận bản tin + Turnstile lười,
 * JSON tới `POST /api/public/newsletter` qua `usePublicForm` (cùng luồng lỗi / thử lại / token dùng 1 lần như form lead). Thành công: `FormStatus`
 * (`role="status"`) thay form; lỗi: `FormErrorSummary` (`role="alert"`). Hai panel này mặc định nền sáng nên trong thẻ tối được đổi sang nền trong mờ,
 * và `--color-error` của thẻ trỏ về `--color-error-subtle` để chữ lỗi đạt tương phản trên nền tối (token sẵn có, không thêm màu).
 * Client island: không JS thì form không gửi được (giống form lead).
 */
export function NewsletterSignup({ turnstileSiteKey, className }: NewsletterSignupProps) {
  const t = useTranslations("newsletter");
  const tForm = useTranslations("form");
  const headingId = useId();

  const form = usePublicForm({
    endpoint: ENDPOINT,
    encoding: "json",
    fieldNames: FIELD_NAMES,
    validate: ({ email }: FormFields): Record<string, string> =>
      typeof email === "string" && email.length <= MAX_EMAIL_CHARS && EMAIL_SHAPE.test(email) ? {} : { email: t("errors.email") },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    return form.handleSubmit(event, { sourcePath: window.location.pathname });
  }

  const submitting = form.status === "submitting";
  const { issue } = form;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("theme-dark-block flex flex-col gap-5 rounded-[20px] bg-dark-deep p-6 text-on-dark [--color-error:var(--color-error-subtle)] [--color-success:var(--color-on-dark-accent)]", className)}
    >
      <div className="flex flex-col gap-2">
        <p className="text-eyebrow text-on-dark-accent uppercase">{t("eyebrow")}</p>
        <h2 id={headingId} className="font-display text-h3 text-on-dark">
          {t("title")}
        </h2>
      </div>
      {form.status === "success" ? (
        <FormStatus title={t("success.title")} description={t("success.description")} className="bg-on-dark/5 p-5" />
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            name="email"
            type="email"
            inputMode="email"
            label={t("email")}
            labelHidden
            placeholder={t("emailPlaceholder")}
            icon={<EnvelopeSimple size={18} />}
            required
            requiredLabel={tForm("required")}
            autoComplete="email"
            maxLength={MAX_EMAIL_CHARS}
            error={form.fieldErrors.email}
          />
          <ConsentCheckbox {...form.consent} disabled={submitting} label={(policy) => t.rich("consent", { policy })} />
          <TurnstileWidget siteKey={turnstileSiteKey} {...form.turnstile} />
          {issue && (
            <FormErrorSummary
              message={issue.message}
              details={issue.details}
              tone={issue.kind === "rate-limit" ? "warning" : "error"}
              onRetry={issue.retryable ? form.retry : undefined}
              className="bg-on-dark/5"
            />
          )}
          <Button type="submit" size="lg" disabled={submitting} aria-busy={submitting} className="w-full">
            {submitting ? tForm("submitting") : t("submit")}
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </Button>
        </form>
      )}
      <p className="text-xsmall text-on-dark-muted">{t("privacyNote")}</p>
    </section>
  );
}
