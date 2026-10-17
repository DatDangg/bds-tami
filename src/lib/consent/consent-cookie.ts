/**
 * Cookie đồng ý `tami_consent` (design-spec §3.10, LGL-03): `{v:1, analytics, ts, pv}`. Chỉ client đọc/ghi: HTML trang
 * công khai không phụ thuộc cookie nên CDN cache được.
 * `pv` = `site-settings.privacyPolicyVersion` lúc khách chọn; khác phiên bản hiện hành thì phải hỏi lại. Spec chỉ nêu
 * `{v,analytics,ts}`, `pv` là trường thêm vì không có nơi nào khác để biết khách đã đồng ý với bản chính sách nào.
 */
export const CONSENT_COOKIE = "tami_consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_SECONDS * 1000;
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

export interface ConsentRecord {
  v: 1;
  analytics: boolean;
  ts: number;
  pv: string;
}

export function isValidGaMeasurementId(value: string | null | undefined): value is string {
  return typeof value === "string" && GA_ID_PATTERN.test(value);
}

/** Cookie hỏng / sai dạng / quá 12 tháng → `null` (coi như chưa chọn, hiện lại banner). */
export function parseConsent(raw: string | null | undefined, now: number = Date.now()): ConsentRecord | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { v, analytics, ts, pv } = value as Record<string, unknown>;
  if (v !== 1 || typeof analytics !== "boolean" || typeof ts !== "number" || !Number.isFinite(ts)) return null;
  if (pv !== undefined && typeof pv !== "string") return null;
  if (now - ts > CONSENT_MAX_AGE_MS || ts - now > CONSENT_MAX_AGE_MS) return null;
  return { v: 1, analytics, ts, pv: pv ?? "" };
}

/** Lựa chọn còn hiệu lực chỉ khi cùng phiên bản chính sách; đổi `privacyPolicyVersion` → `null` → hỏi lại. */
export function currentConsent(record: ConsentRecord | null, policyVersion: string): ConsentRecord | null {
  return record && record.pv === policyVersion ? record : null;
}

function readCookieValue(name: string): string | null {
  for (const part of document.cookie.split("; ")) {
    const separator = part.indexOf("=");
    if (separator > 0 && part.slice(0, separator) === name) return part.slice(separator + 1);
  }
  return null;
}

/** Phát trên `window` sau mỗi lần ghi để UI (useSyncExternalStore) đọc lại cookie. */
export const CONSENT_CHANGED_EVENT = "tami:consent-changed";

export function readRawConsent(): string | null {
  return readCookieValue(CONSENT_COOKIE);
}

export function readConsent(): ConsentRecord | null {
  return parseConsent(readRawConsent());
}

export function writeConsent(analytics: boolean, policyVersion: string): ConsentRecord {
  const record: ConsentRecord = { v: 1, analytics, ts: Date.now(), pv: policyVersion };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  return record;
}

function isGoogleAnalyticsCookie(name: string): boolean {
  return name === "_ga" || name.startsWith("_ga_") || name === "_gid" || name.startsWith("_gat");
}

/** Domain mà GA có thể đã ghi cookie: host hiện tại và các domain cha (`a.b.vn` → `.a.b.vn`, `.b.vn`). */
function candidateCookieDomains(hostname: string): string[] {
  const labels = hostname.split(".");
  const domains: string[] = [];
  for (let start = 0; start < labels.length - 1; start += 1) domains.push(`.${labels.slice(start).join(".")}`);
  return domains;
}

/** Xoá `_ga`, `_ga_<ID>`, `_gid`, `_gat*` ở mọi domain có thể (rút lại đồng ý). */
export function clearGoogleAnalyticsCookies(): void {
  const names = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0] ?? "")
    .filter(isGoogleAnalyticsCookie);
  const domains = ["", ...candidateCookieDomains(window.location.hostname)];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}
