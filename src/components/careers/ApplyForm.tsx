"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormField } from "@/components/forms/FormField";
import { FormErrorSummary, FormStatus } from "@/components/forms/FormStatus";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { usePublicForm, type FormFields } from "@/components/forms/use-public-form";
import { X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { normalizePhone } from "@/lib/phone";

const ENDPOINT = "/api/public/job-applications";
const FIELD_NAMES = ["fullName", "phone", "email", "cv", "message"] as const;
const CV_ACCEPT = ".pdf,.doc,.docx";
const CV_EXTENSION = /\.(pdf|doc|docx)$/i;
/** Cùng trần với server (ERD §4.11: CV tối đa 5MB); server vẫn kiểm lại theo nội dung file. */
const CV_MAX_BYTES = 5 * 1024 * 1024;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApplyFormProps {
  jobPostingId: string;
  /** Đường dẫn danh sách tuyển dụng theo ngôn ngữ (link khi vị trí hết hạn trong lúc mở trang). */
  listPath: string;
  /** Site key Turnstile (công khai); thiếu thì form báo không tải được bước xác minh khi gửi. */
  turnstileSiteKey?: string;
  hotline?: { label: string; telHref: string };
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Form ứng tuyển S13 (FR-PUB-09, design-spec §3.4): multipart tới `POST /api/public/job-applications`.
 * File CV được kiểm đuôi + dung lượng ngay khi chọn (không gửi file đã biết là sai); file hợp lệ giữ trong state để hiện tên/dung lượng/nút xoá.
 * Các trạng thái lỗi/captcha/429 dùng chung `usePublicForm`; 400 không kèm chi tiết = vị trí đã hết hạn (`postingClosed`); lỗi do file CV luôn kèm `details` field `cv` nên gắn vào ô CV, không bị nhầm thành hết hạn.
 */
export function ApplyForm({ jobPostingId, listPath, turnstileSiteKey, hotline }: ApplyFormProps) {
  const t = useTranslations("page.careerDetail.applyForm");
  const tForm = useTranslations("form");
  const formRef = useRef<HTMLFormElement>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | undefined>();

  const form = usePublicForm({
    endpoint: ENDPOINT,
    encoding: "multipart",
    fieldNames: FIELD_NAMES,
    fileField: "cv",
    validate: (fields: FormFields) => {
      const errors: Record<string, string> = {};
      const fullName = fields.fullName;
      if (typeof fullName !== "string" || fullName.length < 2) errors.fullName = t("errors.fullName");
      const phone = fields.phone;
      if (typeof phone !== "string" || normalizePhone(phone) === null) errors.phone = t("errors.phone");
      const email = fields.email;
      if (typeof email !== "string" || !EMAIL_SHAPE.test(email)) errors.email = t("errors.email");
      if (!(fields.cv instanceof Blob)) errors.cv = t("errors.cvMissing");
      return errors;
    },
  });

  function clearFileInput() {
    const input = formRef.current?.elements.namedItem("cv");
    if (input instanceof HTMLInputElement) input.value = "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setCv(null);
      setCvError(undefined);
      return;
    }
    const problem = !CV_EXTENSION.test(file.name) ? t("errors.cvType") : file.size > CV_MAX_BYTES ? t("errors.cvTooLarge") : undefined;
    if (problem) {
      clearFileInput();
      setCv(null);
      setCvError(problem);
      return;
    }
    setCvError(undefined);
    setCv(file);
  }

  function removeFile() {
    clearFileInput();
    setCv(null);
    setCvError(undefined);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    return form.handleSubmit(event, { jobPostingId }, cv ? { cv } : undefined);
  }

  if (form.status === "success") return <FormStatus description={t("success")} />;

  const submitting = form.status === "submitting";
  const { issue } = form;
  const expired = issue?.kind === "validation" && issue.details.length === 0 && Object.keys(form.fieldErrors).length === 0;
  const requiredLabel = tForm("required");

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField name="fullName" label={t("fullName")} required requiredLabel={requiredLabel} autoComplete="name" readOnly={submitting} error={form.fieldErrors.fullName} />
      <FormField name="phone" type="tel" inputMode="tel" label={t("phone")} required requiredLabel={requiredLabel} autoComplete="tel" readOnly={submitting} error={form.fieldErrors.phone} />
      <FormField name="email" type="email" label={t("email")} required requiredLabel={requiredLabel} autoComplete="email" readOnly={submitting} error={form.fieldErrors.email} />
      <div className="flex flex-col gap-2">
        <FormField
          as="file"
          name="cv"
          label={t("cv")}
          required
          requiredLabel={requiredLabel}
          helper={t("cvHelper")}
          accept={CV_ACCEPT}
          disabled={submitting}
          onChange={handleFileChange}
          error={cvError ?? form.fieldErrors.cv}
        />
        {cv && (
          <div className="flex min-h-11 items-center justify-between gap-3 rounded-sm bg-surface px-3 text-small text-text">
            <span className="min-w-0 truncate font-semibold">{cv.name}</span>
            <span className="shrink-0 text-text-muted">{formatFileSize(cv.size)}</span>
            <button
              type="button"
              onClick={removeFile}
              disabled={submitting}
              aria-label={t("removeFile", { name: cv.name })}
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-secondary hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <FormField as="textarea" name="message" label={t("message")} maxLength={2000} readOnly={submitting} error={form.fieldErrors.message} />
      <ConsentCheckbox {...form.consent} disabled={submitting} />
      <TurnstileWidget siteKey={turnstileSiteKey} {...form.turnstile} />
      {issue &&
        (expired ? (
          <div role="alert" className="flex flex-col gap-2 rounded-md border border-warning bg-warning-subtle p-4 text-small text-text">
            <p className="font-semibold">{t("expired")}</p>
            <a href={listPath} className="inline-flex min-h-11 w-fit items-center font-semibold text-accent-text underline underline-offset-4">
              {t("viewOpenJobs")}
            </a>
          </div>
        ) : (
          <FormErrorSummary
            message={issue.message}
            details={issue.details}
            tone={issue.kind === "rate-limit" ? "warning" : "error"}
            onRetry={issue.retryable ? form.retry : undefined}
            hotline={hotline && (issue.kind === "rate-limit" || issue.retryable) ? { label: hotline.label, href: hotline.telHref } : undefined}
          />
        ))}
      <Button type="submit" size="lg" disabled={submitting} aria-busy={submitting} className="w-full sm:w-fit">
        {submitting ? tForm("submitting") : t("submit")}
      </Button>
    </form>
  );
}
