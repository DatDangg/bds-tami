import type { SelectFieldSingleValidation, TextFieldSingleValidation } from "payload";
import { select as defaultSelectValidate, text as defaultTextValidate } from "payload/shared";

import { isHttpUrl } from "../../lib/content/nav-link";

/** Nền tảng được phép nhiều dòng (mỗi dòng một link riêng). */
const MULTI_ROW_PLATFORM = "other";

export const SOCIAL_URL_REQUIRED_MESSAGE = "Vui lòng nhập Link trang";
export const SOCIAL_URL_INVALID_MESSAGE = "Địa chỉ phải bắt đầu bằng http:// hoặc https://";

interface SocialRow {
  platform?: unknown;
  url?: unknown;
}

/**
 * Chuẩn hoá link để so trùng: bỏ http/https, host không phân biệt hoa thường, bỏ `www.` ở host, bỏ `/` cuối path.
 * Path, query và hash giữ nguyên hoa thường (phân biệt được tài khoản theo path).
 */
export function normalizeSocialUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    const host = parsed.host.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

const asRows = (data: unknown): SocialRow[] => {
  const rows = (data as { socialLinks?: unknown } | undefined)?.socialLinks;
  return Array.isArray(rows) ? (rows as SocialRow[]) : [];
};

/**
 * Chỉ số dòng trong mảng `socialLinks` lấy từ path của field. Payload 3.x truyền path dạng chuỗi
 * (["socialLinks", "1", "url"]) lúc lưu (beforeChange); form admin khi đang sửa (onChange) không truyền path → -1, kiểm trùng
 * chỉ chạy lúc lưu. Chấp nhận cả số cho chắc.
 */
const rowIndexFromPath = (path: readonly (string | number)[] | undefined): number => {
  const segment = path?.find((part) => typeof part === "number" || /^\d+$/.test(part));
  return segment === undefined ? -1 : Number(segment);
};

/** Link trang: bắt buộc (validate tuỳ biến thay validate mặc định nên phải tự kiểm) + http(s) + không trùng dòng trước. */
export const validateSocialUrl: TextFieldSingleValidation = (value, options) => {
  if (typeof value !== "string" || value.trim() === "") return SOCIAL_URL_REQUIRED_MESSAGE;
  const url = value.trim();
  if (!isHttpUrl(url)) return SOCIAL_URL_INVALID_MESSAGE;
  // Giữ kiểm mặc định của `text` (maxLength...) vì validate tuỳ biến đã thay nó.
  const defaultResult = defaultTextValidate(url, options);
  if (defaultResult !== true) return defaultResult;

  const index = rowIndexFromPath(options.path);
  const normalized = normalizeSocialUrl(url);
  const earlier = asRows(options.data).slice(0, Math.max(index, 0));
  const duplicateAt = earlier.findIndex((row) => typeof row.url === "string" && row.url.trim() !== "" && normalizeSocialUrl(row.url) === normalized);
  return duplicateAt === -1 ? true : `Link trang trùng với dòng ${duplicateAt + 1}.`;
};

/** Nền tảng: mỗi nền tảng tối đa 1 dòng, trừ "Khác". `labels` để báo tên hiển thị. */
export const createValidatePlatform = (labels: Record<string, string>): SelectFieldSingleValidation => (value, options) => {
  if (typeof value !== "string" || value === "") return "Vui lòng chọn nền tảng";
  // Giữ kiểm mặc định của `select` (giá trị phải nằm trong options).
  const defaultResult = defaultSelectValidate(value, options);
  if (defaultResult !== true) return defaultResult;
  if (value === MULTI_ROW_PLATFORM) return true;
  const index = rowIndexFromPath(options.path);
  const duplicateAt = asRows(options.data).slice(0, Math.max(index, 0)).findIndex((row) => row.platform === value);
  return duplicateAt === -1 ? true : `Nền tảng ${labels[value] ?? value} đã có ở dòng ${duplicateAt + 1}.`;
};
