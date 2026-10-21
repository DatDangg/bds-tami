import { relativeTimeVi } from "../../components/admin/dashboard/dashboard-format";

const URL_LABEL_MAX = 60;

export interface LeadLink {
  /** Chỉ có khi là http(s): các scheme khác (`javascript:`, `data:`…) chỉ hiện chữ, không bấm được. */
  href?: string;
  label: string;
}

/** Link rút gọn "host/đường-dẫn…" cho Trang khách gửi/đến; chỉ http(s) mới có `href`. Rỗng → null. */
export function describeLeadLink(raw: unknown): LeadLink | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { label: text.length > URL_LABEL_MAX ? `${text.slice(0, URL_LABEL_MAX)}…` : text };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { label: text.length > URL_LABEL_MAX ? `${text.slice(0, URL_LABEL_MAX)}…` : text };
  const short = `${url.host}${url.pathname === "/" ? "" : url.pathname}`;
  return { href: url.href, label: short.length > URL_LABEL_MAX ? `${short.slice(0, URL_LABEL_MAX)}…` : short };
}

/** SĐT về dạng 0xxxxxxxxx (bỏ khoảng trắng/ký tự, +84/84 → 0) cho link Zalo. Không đủ chữ số → null. */
export function zaloNumber(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return /^0\d{8,10}$/.test(local) ? local : null;
}

/** `tel:` chỉ giữ chữ số và dấu + đầu số. */
export function telHref(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const compact = phone.trim().replace(/[^\d+]/g, "");
  return /\d/.test(compact) ? `tel:${compact}` : null;
}

/** `mailto:` chỉ khi có đúng một dấu @ và không có khoảng trắng. */
export function mailtoHref(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim();
  return /^[^\s@]+@[^\s@]+$/.test(value) ? `mailto:${value}` : null;
}

/** dd/MM/yyyy HH:mm giờ Việt Nam (ghép từ parts để thứ tự cố định theo mọi runtime). */
const dateTimeVi = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}/${pick("month")}/${pick("year")} ${pick("hour")}:${pick("minute")}`;
};

/** "Hoạt động gần nhất: 2 giờ trước · Liên hệ lần đầu: 20/10/2026 09:30 · Khách gửi lại 2 lần" — bỏ phần trống. */
export function summarizeLeadActivity(input: { lastActivityAt?: unknown; firstContactedAt?: unknown; mergedCount?: unknown }, now: Date): string {
  const parts: string[] = [];
  const last = typeof input.lastActivityAt === "string" ? relativeTimeVi(input.lastActivityAt, now) : "";
  if (last) parts.push(`Hoạt động gần nhất: ${last}`);
  const first = typeof input.firstContactedAt === "string" ? dateTimeVi(input.firstContactedAt) : "";
  if (first) parts.push(`Liên hệ lần đầu: ${first}`);
  if (typeof input.mergedCount === "number" && input.mergedCount > 0) parts.push(`Khách gửi lại ${input.mergedCount} lần`);
  return parts.join(" · ");
}
