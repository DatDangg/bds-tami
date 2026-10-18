"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  buildJsonBody,
  buildMultipartBody,
  collectFields,
  isCaptchaFailureMessage,
  parseDetails,
  readErrorCode,
  readErrorDetails,
  readErrorMessage,
  retryAfterMinutes,
  type FormFields,
  type SubmitExtra,
} from "./submit-helpers";

export type { FormFields } from "./submit-helpers";

type PublicFormOptions = {
  /** Ví dụ `/api/public/leads`. */
  endpoint: string;
  /** `json` cho lead, `multipart` khi có CV (API_SPEC §3.1/§3.2). */
  encoding: "json" | "multipart";
  /** Tên các ô hiển thị trên form: lỗi `details` của field khác không gắn được vào ô nên đưa vào tóm tắt. */
  fieldNames: readonly string[];
  /** Ô file (multipart): 413/415 gắn vào đây. */
  fileField?: string;
  /** Validate client (cùng luật API), trả `{tênField: thông báo đã dịch}`; rỗng = hợp lệ. */
  validate?: (fields: FormFields) => Record<string, string>;
};

export type FormIssue = {
  kind: "validation" | "captcha" | "rate-limit" | "unavailable" | "server" | "network";
  message: string;
  /** Lỗi không gắn được vào ô nào. */
  details: string[];
  /** Lỗi tạm thời: hiện nút Thử lại. */
  retryable: boolean;
  /** `code` máy đọc được do API trả (vd `postingClosed`), nếu có. */
  code?: string;
};

type Status = "idle" | "submitting" | "success";
type Translate = ReturnType<typeof useTranslations>;

/** Lỗi 413/415 của API mang nghĩa theo field file; các mã khác dùng chung. */
function failureFromStatus(statusCode: number, retryAfter: string | null, t: Translate): Pick<FormIssue, "kind" | "message" | "retryable"> {
  if (statusCode === 429) return { kind: "rate-limit", message: t("errors.rateLimit", { minutes: retryAfterMinutes(retryAfter) }), retryable: false };
  if (statusCode === 503) return { kind: "unavailable", message: t("errors.unavailable"), retryable: true };
  return { kind: "server", message: t("errors.generic"), retryable: true };
}

export function usePublicForm({ endpoint, encoding, fieldNames, fileField, validate }: PublicFormOptions) {
  const t = useTranslations("form");
  const locale = useLocale();
  // Form được ghi nhớ lúc submit (từ event) để focus ô lỗi; không dùng ref vì react-hooks/refs coi cả kết quả hook là ref.
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [issue, setIssue] = useState<FormIssue | null>(null);
  const [consent, setConsent] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  // State (không phải ref) để kết quả hook dùng được trong render; submit là sự kiện rời rạc nên luôn đọc bản mới nhất.
  const [token, setToken] = useState<string | null>(null);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);
  // Cờ đang gửi đọc đồng bộ trong handler: chặn chắc chắn kể cả khi `submit()` bị gọi 2 lần trước khi React render lại.
  const inFlightRef = useRef(false);
  const [lastSubmit, setLastSubmit] = useState<{ fields: FormFields; extra?: SubmitExtra } | null>(null);

  // Sau khi lỗi được render (aria-invalid đã gắn) mới focus ô lỗi đầu tiên theo thứ tự DOM.
  useEffect(() => {
    if (focusRequest === 0) return;
    formElement?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest, formElement]);

  const onToken = useCallback((next: string | null) => {
    setToken(next);
    if (next) setCaptchaUnavailable(false);
  }, []);
  const onUnavailable = useCallback(() => setCaptchaUnavailable(true), []);

  function failWith(next: FormIssue, errors: Record<string, string> = {}) {
    setStatus("idle");
    setFieldErrors(errors);
    setIssue(next);
    if (Object.keys(errors).length > 0) setFocusRequest((count) => count + 1);
  }

  /** 400 không có detail nào: chỉ gọi là captcha khi message server nói vậy, còn lại hiện message server hoặc lỗi chung. */
  function failFromBareBadRequest(serverMessage: string | undefined) {
    if (isCaptchaFailureMessage(serverMessage)) {
      failWith({ kind: "captcha", message: t("captcha.failed"), details: [], retryable: false });
      return;
    }
    failWith({ kind: "validation", message: serverMessage ?? t("errors.generic"), details: [], retryable: false });
  }

  function failFromBody(statusCode: number, body: unknown, retryAfter: string | null) {
    const known = new Set([...fieldNames, "consent", ...(fileField ? [fileField] : [])]);
    if (statusCode === 400) {
      const code = readErrorCode(body);
      if (code) {
        failWith({ kind: "validation", message: readErrorMessage(body) ?? t("errors.generic"), details: [], retryable: false, code });
        return;
      }
      const errors: Record<string, string> = {};
      const details: string[] = [];
      for (const { field, message } of parseDetails(readErrorDetails(body))) {
        if (known.has(field)) errors[field] ??= message ?? t("errors.invalid");
        else if (message) details.push(message);
      }
      if (Object.keys(errors).length === 0 && details.length === 0) {
        failFromBareBadRequest(readErrorMessage(body));
        return;
      }
      failWith({ kind: "validation", message: t("errors.summary"), details, retryable: false }, errors);
      return;
    }
    if ((statusCode === 413 || statusCode === 415) && fileField) {
      failWith(
        { kind: "validation", message: t("errors.summary"), details: [], retryable: false },
        { [fileField]: t(statusCode === 413 ? "errors.fileTooLarge" : "errors.fileType") },
      );
      return;
    }
    failWith({ ...failureFromStatus(statusCode, retryAfter, t), details: [] });
  }

  async function send(fields: FormFields, extra?: SubmitExtra) {
    const payload = { fields, extra, turnstileToken: token ?? undefined, locale };
    const isJson = encoding === "json";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: isJson ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: isJson ? buildJsonBody(payload) : buildMultipartBody(payload),
    });
    if (response.ok) {
      // Không giữ họ tên/SĐT/file CV trong state sau khi đã gửi xong.
      setLastSubmit(null);
      setStatus("success");
      return;
    }
    const body: unknown = await response.json().catch(() => null);
    failFromBody(response.status, body, response.headers.get("Retry-After"));
  }

  async function submit(fields: FormFields, extra?: SubmitExtra) {
    if (inFlightRef.current) return;
    const clientErrors = { ...validate?.(fields) };
    if (!consent) clientErrors.consent = t("consent.required");
    if (Object.keys(clientErrors).length > 0) {
      failWith({ kind: "validation", message: t("errors.summary"), details: [], retryable: false }, clientErrors);
      return;
    }
    if (!token) {
      const message = captchaUnavailable ? t("captcha.unavailable") : t("captcha.pending");
      failWith({ kind: "captcha", message, details: [], retryable: false });
      return;
    }

    inFlightRef.current = true;
    setLastSubmit({ fields, extra });
    setStatus("submitting");
    setFieldErrors({});
    setIssue(null);
    try {
      await send(fields, extra);
    } catch {
      failWith({ kind: "network", message: t("errors.network"), details: [], retryable: true });
    } finally {
      inFlightRef.current = false;
      // Token Turnstile chỉ dùng được 1 lần, dù thành công hay lỗi: xin token mới.
      setToken(null);
      setResetSignal((count) => count + 1);
    }
  }

  /** `additionalFields`: ô không đọc được từ DOM (vd file CV form giữ trong state để hiện tên/dung lượng). */
  function handleSubmit(event: FormEvent<HTMLFormElement>, extra?: SubmitExtra, additionalFields?: FormFields) {
    event.preventDefault();
    setFormElement(event.currentTarget);
    return submit({ ...collectFields(event.currentTarget), ...additionalFields }, extra);
  }

  /** Gửi lại theo nội dung form hiện tại (người dùng có thể đã sửa); chỉ luồng `submit()` trực tiếp mới dùng bản đã lưu. */
  function retry() {
    if (formElement) formElement.requestSubmit();
    else if (lastSubmit) void submit(lastSubmit.fields, lastSubmit.extra);
  }

  function setConsentChecked(checked: boolean) {
    setConsent(checked);
    if (checked) setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([name]) => name !== "consent")));
  }

  return {
    status,
    fieldErrors,
    issue,
    handleSubmit,
    submit,
    retry,
    consent: { checked: consent, onCheckedChange: setConsentChecked, error: fieldErrors.consent },
    turnstile: { onToken, onUnavailable, resetSignal },
  };
}
