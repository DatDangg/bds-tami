// Hàm thuần cho use-public-form: dựng body, đọc `details` của API (API_SPEC §2). Không phụ thuộc React.

export type FormFields = Record<string, string | Blob>;
export type SubmitExtra = Readonly<Record<string, unknown>>;

/** Input ẩn do widget Turnstile tự chèn vào form; token gửi lên bằng `turnstileToken` nên bỏ qua. */
const TURNSTILE_INPUT_NAME = "cf-turnstile-response";

/** Đọc các ô của form; ô rỗng (chuỗi trống, file chưa chọn) bị bỏ để field tuỳ chọn không bị server coi là giá trị sai. */
export function collectFields(form: HTMLFormElement): FormFields {
  const fields: FormFields = {};
  for (const [name, value] of new FormData(form)) {
    if (name === TURNSTILE_INPUT_NAME) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) fields[name] = trimmed;
    } else if (value.size > 0) {
      fields[name] = value;
    }
  }
  return fields;
}

export type SubmitPayload = { fields: FormFields; extra?: SubmitExtra; turnstileToken?: string; locale: string };

/** consent luôn là `true` (hook đã chặn khi chưa tick); phiên bản chính sách do server gắn khi lưu (BR-30). */
export function buildJsonBody({ fields, extra, turnstileToken, locale }: SubmitPayload): string {
  const textFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === "string"));
  return JSON.stringify({ ...extra, ...textFields, consent: true, turnstileToken, locale });
}

/** `extra` trong multipart chỉ gửi được chuỗi: number/boolean -> String, object (vd `utm`) -> JSON; null/undefined thì bỏ. */
function extraToFormValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return undefined;
}

/** Multipart: không tự đặt Content-Type để trình duyệt thêm boundary. */
export function buildMultipartBody({ fields, extra, turnstileToken, locale }: SubmitPayload): FormData {
  const body = new FormData();
  for (const [name, value] of Object.entries(extra ?? {})) {
    const formValue = extraToFormValue(value);
    if (formValue !== undefined) body.append(name, formValue);
  }
  for (const [name, value] of Object.entries(fields)) body.append(name, value);
  body.set("consent", "true");
  body.set("locale", locale);
  if (turnstileToken) body.set("turnstileToken", turnstileToken);
  return body;
}

export type DetailError = { field: string; message?: string };

/**
 * `details` do server không cố định hình: chấp nhận `{path: [...]|string, message}` (zod issue) hoặc `{field, message}`.
 * Item chỉ có `message` (path rỗng của zod root, hoặc `{message}` như click-events) trả `field: ""` để vào tóm tắt lỗi chung.
 */
export function parseDetails(details: unknown): DetailError[] {
  if (!Array.isArray(details)) return [];
  const result: DetailError[] = [];
  for (const item of details) {
    if (typeof item !== "object" || item === null) continue;
    const { field, path, message } = item as { field?: unknown; path?: unknown; message?: unknown };
    const name = typeof field === "string" ? field : Array.isArray(path) ? path[0] : path;
    const hasName = typeof name === "string" || typeof name === "number";
    const text = typeof message === "string" && message ? message : undefined;
    if (!hasName && !text) continue;
    result.push({ field: hasName ? String(name) : "", message: text });
  }
  return result;
}

export function readErrorDetails(body: unknown): unknown {
  return typeof body === "object" && body !== null ? (body as { details?: unknown }).details : undefined;
}

/** `code` (mã máy đọc được, API_SPEC §2) của body lỗi; thiếu hoặc không phải chuỗi thì `undefined`. */
export function readErrorCode(body: unknown): string | undefined {
  const code = typeof body === "object" && body !== null ? (body as { code?: unknown }).code : undefined;
  return typeof code === "string" && code ? code : undefined;
}

/** `error` của API là message đã theo locale (API_SPEC §2); hiện thẳng cho người dùng. */
export function readErrorMessage(body: unknown): string | undefined {
  const error = typeof body === "object" && body !== null ? (body as { error?: unknown }).error : undefined;
  return typeof error === "string" && error ? error : undefined;
}

/**
 * Pipeline public trả 400 `details: []` cho cả captcha lỗi lẫn body hỏng và không có mã máy đọc được
 * (public-pipeline.ts), nên chỉ nhận ra captcha khi message nhắc tới "captcha". Không nhận ra thì không gán nhãn captcha.
 */
export function isCaptchaFailureMessage(message: string | undefined): boolean {
  return message !== undefined && /captcha/i.test(message);
}

/** `Retry-After` tính bằng giây (API_SPEC §2) -> số phút làm tròn lên, tối thiểu 1; thiếu/sai thì 1. */
export function retryAfterMinutes(header: string | null): number {
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : 1;
}
