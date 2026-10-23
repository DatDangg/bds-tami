"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { CvPicker } from "@/components/careers/CvPicker";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormField } from "@/components/forms/FormField";
import { FormErrorSummary, FormStatus } from "@/components/forms/FormStatus";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { EnvelopeSimple, Phone, User } from "@/components/icons";
import { usePublicForm, type FormFields } from "@/components/forms/use-public-form";
import { Button } from "@/components/ui/button";
import { normalizePhone } from "@/lib/phone";
import { API_ERROR_CODES } from "@/shared/types/api";

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

/**
 * Form ứng tuyển S13 (FR-PUB-09, design-spec §3.4): multipart tới `POST /api/public/job-applications`.
 * File CV (chọn tệp hoặc kéo-thả, `CvPicker`) được kiểm đuôi + dung lượng ngay khi nhận (không gửi file đã biết là sai); file hợp lệ giữ trong state
 * để hiện tên/dung lượng/nút xoá và để gửi (file thả không nằm trong `input.files`). Gửi bằng XHR (`trackUploadProgress`) để nút hiện % upload.
 * Các trạng thái lỗi/captcha/429 dùng chung `usePublicForm`; vị trí đã hết hạn nhận biết bằng `code: "postingClosed"` của API (API_SPEC §3.2), không dựa vào cấu trúc `details`; lỗi do file CV kèm `details` field `cv` nên gắn vào ô CV.
 */
export function ApplyForm({ jobPostingId, listPath, turnstileSiteKey, hotline }: ApplyFormProps) {
  const t = useTranslations("page.careerDetail.applyForm");
  const tv = useTranslations("page.jobDetail.v2.form");
  const tForm = useTranslations("form");
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | undefined>();

  const form = usePublicForm({
    endpoint: ENDPOINT,
    encoding: "multipart",
    fieldNames: FIELD_NAMES,
    fileField: "cv",
    trackUploadProgress: true,
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

  /** Một luật cho cả hộp chọn lẫn kéo-thả; `undefined` = huỷ hộp chọn → về trạng thái chưa có file. */
  function acceptCv(file: File | undefined) {
    if (!file) {
      setCv(null);
      setCvError(undefined);
      return;
    }
    const problem = !CV_EXTENSION.test(file.name) ? t("errors.cvType") : file.size > CV_MAX_BYTES ? t("errors.cvTooLarge") : undefined;
    setCv(problem ? null : file);
    setCvError(problem);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    return form.handleSubmit(event, { jobPostingId }, cv ? { cv } : undefined);
  }

  if (form.status === "success") return <FormStatus description={t("success")} />;

  const submitting = form.status === "submitting";
  const { issue, uploadPercent } = form;
  const expired = issue?.code === API_ERROR_CODES.postingClosed;
  const requiredLabel = tForm("required");
  // Upload 100% nhưng server còn xử lý (lưu/scan file) → về nhãn "Đang gửi…" thay vì đứng ở 100%.
  const showPercent = submitting && uploadPercent !== null;
  const submitLabel = !submitting ? tv("submit") : uploadPercent === null || uploadPercent >= 100 ? tForm("submitting") : t("uploading", { percent: uploadPercent });

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField name="fullName" label={t("fullName")} icon={<User size={18} />} placeholder={tv("fullNamePlaceholder")} required requiredLabel={requiredLabel} autoComplete="name" readOnly={submitting} error={form.fieldErrors.fullName} />
      <FormField name="phone" type="tel" inputMode="tel" label={t("phone")} icon={<Phone size={18} />} placeholder={tv("phonePlaceholder")} required requiredLabel={requiredLabel} autoComplete="tel" readOnly={submitting} error={form.fieldErrors.phone} />
      <FormField name="email" type="email" label={t("email")} icon={<EnvelopeSimple size={18} />} placeholder={tv("emailPlaceholder")} required requiredLabel={requiredLabel} autoComplete="email" readOnly={submitting} error={form.fieldErrors.email} />
      <CvPicker
        name="cv"
        accept={CV_ACCEPT}
        file={cv}
        disabled={submitting}
        error={cvError ?? form.fieldErrors.cv}
        labels={{
          field: tv("cv"),
          required: requiredLabel,
          helper: t("cvHelper"),
          chooseFile: t("chooseFile"),
          dropHint: t("dropHint"),
          removeFile: (name) => t("removeFile", { name }),
        }}
        onPick={acceptCv}
        onRemove={() => acceptCv(undefined)}
      />
      <FormField as="textarea" name="message" label={t("message")} maxLength={2000} readOnly={submitting} error={form.fieldErrors.message} />
      <ConsentCheckbox {...form.consent} disabled={submitting} />
      <TurnstileWidget siteKey={turnstileSiteKey} {...form.turnstile} />
      {issue &&
        (expired ? (
          <div role="alert" className="flex flex-col gap-2 rounded-md border border-warning bg-warning-subtle p-4 text-small text-text">
            <p className="font-semibold">{t("expired")}</p>
            <a href={listPath} className="inline-flex min-h-11 w-fit items-center font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text">
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
      <Button type="submit" size="lg" disabled={submitting} aria-busy={submitting} className="relative w-full overflow-hidden">
        {/* Dải tô theo % ngay trong nút, không có track nền (taste §9.F). Chỉ thị giác (aria-hidden): con của <button> là presentational theo ARIA. */}
        {showPercent && (
          <span
            aria-hidden="true"
            style={{ width: `${uploadPercent}%` }}
            className="absolute inset-y-0 left-0 bg-primary-foreground/15 transition-[width] duration-(--duration-fast) ease-linear motion-reduce:transition-none"
          />
        )}
        <span className="relative">{submitLabel}</span>
      </Button>
      {/* Progressbar đứng NGOÀI nút để trình đọc màn hình đọc được giá trị (không dùng aria-live để khỏi đọc từng %). */}
      {showPercent && <span role="progressbar" aria-label={t("uploadProgress")} aria-valuenow={uploadPercent} aria-valuemin={0} aria-valuemax={100} className="sr-only" />}
    </form>
  );
}
