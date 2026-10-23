"use client";

import { useTranslations } from "next-intl";
import type { FormEvent, ReactNode } from "react";
import { ArrowRight, ChatText, EnvelopeSimple, Phone, User } from "@/components/icons";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormField } from "@/components/forms/FormField";
import { FormErrorSummary, FormStatus } from "@/components/forms/FormStatus";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { usePublicForm, type FormFields } from "@/components/forms/use-public-form";
import { Button } from "@/components/ui/button";
import { readUtm } from "@/lib/leads/utm";
import { hasSourceRecord, type LeadSource } from "@/lib/leads/lead-values";
import { normalizePhone } from "@/lib/phone";

const ENDPOINT = "/api/public/leads";
const FIELD_NAMES = ["fullName", "phone", "email", "message"] as const;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadFormProps {
  source: LeadSource;
  /** Id bản ghi nguồn (tin cho thuê/tin BĐS/dự án); bỏ qua khi `source` là `contact` / `popup`. Tin đã thuê vẫn gửi id tin đó (FR-PUB-13). */
  sourceId?: string;
  /** Site key Turnstile (công khai); thiếu thì form báo không tải được bước xác minh khi gửi. */
  turnstileSiteKey?: string;
  hotline?: { label: string; telHref: string };
  /**
   * `compact` (cột liên hệ trang chi tiết, BL-056): nhãn chỉ cho trình đọc màn hình, icon + placeholder trong ô, nút "Nhận tư vấn ngay" full-width.
   * `contact` (/lien-he, BL-054): nhãn hiển thị + icon trong ô, Họ tên / SĐT chung một hàng ≥ sm, nút có mũi tên. Mặc định giữ form đầy đủ (/tin-tuc).
   * Mọi layout cùng trường / payload.
   */
  layout?: "default" | "compact" | "contact";
  /** Nhãn nút gửi thay "Nhận tư vấn" của layout `default` / `contact` (vd "Gửi yêu cầu" ở /lien-he). */
  submitLabel?: string;
}

const ICON_SIZE = 18;

/** Phần body ngoài các ô người dùng nhập: nguồn, UTM (BR-10), URL trang (bỏ `#hash`) và referrer. Chỉ gọi phía client lúc gửi. */
export function buildLeadExtra(source: LeadSource, sourceId: string | undefined): Record<string, unknown> {
  const { origin, pathname, search } = window.location;
  return {
    source,
    ...(hasSourceRecord(source) && sourceId ? { sourceId } : {}),
    utm: readUtm(),
    pageUrl: `${origin}${pathname}${search}`,
    referrer: document.referrer || undefined,
  };
}

interface LeadFieldsProps {
  layout: NonNullable<LeadFormProps["layout"]>;
  submitting: boolean;
  errors: Record<string, string | undefined>;
}

/**
 * Bốn ô nhập của form lead. `compact`: nhãn `sr-only` (vẫn `htmlFor`) + icon trong ô + placeholder = nhãn (ô bắt buộc thêm " *");
 * `contact`: nhãn hiển thị + icon trong ô, Họ tên / SĐT một hàng ≥ sm; mặc định: nhãn hiển thị, không icon / placeholder.
 */
function LeadFields({ layout, submitting, errors }: LeadFieldsProps) {
  const t = useTranslations("form.lead");
  const requiredLabel = useTranslations("form")("required");
  const look = (key: "fullName" | "phone" | "email" | "message", icon: ReactNode, required = false) => {
    if (layout === "compact") return { icon, labelHidden: true, placeholder: required ? `${t(key)} *` : t(key) };
    return layout === "contact" ? { icon } : {};
  };
  return (
    <>
      {/* `contents`: hai ô vẫn là con trực tiếp của lưới form (khoảng cách như cũ); `contact` gom thành một hàng 2 cột. */}
      <div className={layout === "contact" ? "grid gap-5 sm:grid-cols-2" : "contents"}>
        <FormField name="fullName" label={t("fullName")} required requiredLabel={requiredLabel} autoComplete="name" {...look("fullName", <User size={ICON_SIZE} />, true)} readOnly={submitting} error={errors.fullName} />
        <FormField name="phone" type="tel" inputMode="tel" label={t("phone")} required requiredLabel={requiredLabel} autoComplete="tel" {...look("phone", <Phone size={ICON_SIZE} />, true)} readOnly={submitting} error={errors.phone} />
      </div>
      <FormField name="email" type="email" label={t("email")} autoComplete="email" {...look("email", <EnvelopeSimple size={ICON_SIZE} />)} readOnly={submitting} error={errors.email} />
      <FormField as="textarea" name="message" label={t("message")} maxLength={1000} {...look("message", <ChatText size={ICON_SIZE} />)} readOnly={submitting} error={errors.message} />
    </>
  );
}

/**
 * Form lead dùng chung (FR-PUB-03/05/07/11, design-spec §3.3): họ tên + SĐT bắt buộc, email/lời nhắn tuỳ chọn, consent (BR-30), Turnstile lười.
 * JSON tới `POST /api/public/leads`; cảm ơn `role="status"` thay form khi xong, lỗi field map vào ô. Là client island nên HTML trang không đổi
 * theo trạng thái form. `locale` do `usePublicForm` gắn theo ngôn ngữ đang xem.
 */
export function LeadForm({ source, sourceId, turnstileSiteKey, hotline, layout = "default", submitLabel }: LeadFormProps) {
  const t = useTranslations("form.lead");
  const tForm = useTranslations("form");

  // UTM không ghi ở đây: island `UtmCapture` trong PublicShell đã lưu ở mọi trang; lúc gửi `readUtm()` vẫn ưu tiên URL hiện tại.
  const form = usePublicForm({
    endpoint: ENDPOINT,
    encoding: "json",
    fieldNames: FIELD_NAMES,
    validate: (fields: FormFields) => {
      const errors: Record<string, string> = {};
      const { fullName, phone, email } = fields;
      if (typeof fullName !== "string" || fullName.length < 2) errors.fullName = t("errors.fullName");
      if (typeof phone !== "string" || normalizePhone(phone) === null) errors.phone = t("errors.phone");
      if (typeof email === "string" && !EMAIL_SHAPE.test(email)) errors.email = t("errors.email");
      return errors;
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    return form.handleSubmit(event, buildLeadExtra(source, sourceId));
  }

  if (form.status === "success") return <FormStatus />;

  const submitting = form.status === "submitting";
  const { issue } = form;
  const compact = layout === "compact";

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <LeadFields layout={layout} submitting={submitting} errors={form.fieldErrors} />
      <ConsentCheckbox {...form.consent} disabled={submitting} />
      <TurnstileWidget siteKey={turnstileSiteKey} {...form.turnstile} />
      {issue && (
        <FormErrorSummary
          message={issue.message}
          details={issue.details}
          tone={issue.kind === "rate-limit" ? "warning" : "error"}
          onRetry={issue.retryable ? form.retry : undefined}
          hotline={hotline && (issue.kind === "rate-limit" || issue.retryable) ? { label: hotline.label, href: hotline.telHref } : undefined}
        />
      )}
      <Button type="submit" size="lg" disabled={submitting} aria-busy={submitting} className={compact ? "w-full" : "w-full sm:w-fit"}>
        {submitting ? tForm("submitting") : compact ? t("submitNow") : (submitLabel ?? t("submit"))}
        {layout !== "default" && !submitting && <ArrowRight size={18} aria-hidden="true" />}
      </Button>
    </form>
  );
}
