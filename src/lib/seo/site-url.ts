import type { Locale } from "../../i18n/routing";

/**
 * Tên biến lưu trong biến để Next KHÔNG nhúng giá trị lúc `next build`: `process.env.NEXT_PUBLIC_*` viết thẳng sẽ bị thay
 * bằng chuỗi cố định (ở image Docker là `http://localhost:3000` placeholder), làm canonical/OG/JSON-LD sai trên mọi môi
 * trường vì image build 1 lần rồi promote staging -> prod (ARCHITECTURE §6.4). Truy cập bằng khoá động thì đọc lúc chạy.
 */
const SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL";
const APP_ENV_KEY = "APP_ENV";

/**
 * URL gốc công khai (không có `/` cuối), hoặc `undefined` khi chưa biết đúng: lúc `next build` (HTML prerender sẽ được
 * làm mới lúc chạy, nên thà thiếu URL tuyệt đối còn hơn chứa placeholder) hoặc biến thiếu/sai. Nơi gọi bỏ canonical/OG url/JSON-LD.
 */
export function getSiteUrl(): string | undefined {
  if (process.env.NEXT_PHASE === "phase-production-build") return undefined;
  const raw = process.env[SITE_URL_KEY]?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Chỉ production được index; staging/dev/test luôn noindex (kể cả khi quên cấu hình `APP_ENV`: an toàn mặc định). */
export function isIndexingAllowed(): boolean {
  return process.env[APP_ENV_KEY] === "production";
}

/** URL tuyệt đối của một đường dẫn nội bộ; `undefined` nếu chưa biết URL gốc. */
export function absoluteUrl(path: string, siteUrl: string | undefined): string | undefined {
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}

export const OG_LOCALES: Record<Locale, string> = { vi: "vi_VN", en: "en_US" };
