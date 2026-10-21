import type { Locale } from "../../i18n/routing";

const APP_ENV_KEY = "APP_ENV";

/**
 * URL gốc công khai (không có `/` cuối), hoặc `undefined` khi chưa biết đúng: lúc `next build` (HTML prerender sẽ được
 * làm mới lúc chạy, nên thà thiếu URL tuyệt đối còn hơn chứa placeholder) hoặc biến thiếu/sai. Nơi gọi bỏ canonical/OG url/JSON-LD.
 *
 * Phải đọc LÚC CHẠY vì image build 1 lần rồi promote staging -> prod (ARCHITECTURE §6.4). Next (SWC) thay `process.env.NEXT_PUBLIC_*`
 * bằng giá trị lúc build, KỂ CẢ khi khoá nằm trong hằng (`process.env[KEY]` với `const KEY = "NEXT_PUBLIC_..."` vẫn bị gập; BL-053).
 * Chỉ khi truyền NGUYÊN object `process.env` qua hàm (như `getEnv()`) thì không bị gập, nên khoá được đọc bên trong `parseSiteUrl`.
 */
export function getSiteUrl(): string | undefined {
  return parseSiteUrl(process.env);
}

/** Hàm thuần của `getSiteUrl`: nhận cả object env (không viết `process.env.X`) để Next không nhúng giá trị lúc build. */
export function parseSiteUrl(env: Readonly<Record<string, string | undefined>>): string | undefined {
  if (env.NEXT_PHASE === "phase-production-build") return undefined;
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
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
