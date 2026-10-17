import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { logger } from "./lib/logger";
import { resolveMissingPage } from "./lib/content/resolve-missing-page";
import { resolveRedirect } from "./lib/content/resolve-redirect";

const handleI18nRouting = createMiddleware(routing);

/** Đường dẫn không route nào khớp: Next dựng 404 SSR đầy đủ (`app/global-not-found.tsx`) thay vì shell rỗng của `notFound()` trong page. */
const NOT_FOUND_REWRITE_PATH = "/__not-found__/missing";
/** Header next-intl đọc ngôn ngữ (`getLocale()` trong `global-not-found`); next-intl middleware tự đặt, ở đây ta bỏ qua nó nên đặt lại. */
const LOCALE_HEADER = "x-next-intl-locale";

function rewriteToNotFound(request: NextRequest, locale: string) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE_PATH, request.nextUrl), { request: { headers } });
}

/**
 * 1) Slug cũ của nội dung đã đổi slug → 301 tới URL mới cùng ngôn ngữ (BR-05); tra TRƯỚC next-intl vì `from` là URL công khai
 *    (`/tin-tuc/cu`, `/en/news/old`). 2) Trang động (tin tức...) không tồn tại / chưa công khai / thiếu bản EN → rewrite sang 404 SSR
 *    đầy đủ (`resolveMissingPage`: `notFound()` trong page chỉ cho shell rỗng ở HTML server). 3) next-intl trả 307 khi chuẩn hoá URL
 *    (vd `/vi/du-an` → `/du-an`); đây là chuyển hướng vĩnh viễn nên đổi sang 301.
 */
export default async function proxy(request: NextRequest) {
  const target = await resolveRedirect(request.nextUrl.pathname);
  if (target) {
    const location = new URL(target, request.nextUrl);
    location.search = request.nextUrl.search;
    // Phòng thủ lớp 2 (chống open redirect): chỉ chuyển hướng trong cùng origin, bất kể dữ liệu `redirects` ghi gì.
    if (location.origin === request.nextUrl.origin) {
      // Không tự đặt Cache-Control: rule `headers()` của next.config áp cho response này (trang: `public, s-maxage=60, stale-while-revalidate=300`; biến thể RSC: `no-store`).
      return NextResponse.redirect(location, 301);
    }
    logger.warn({ target, pathname: request.nextUrl.pathname }, "Bỏ qua redirect trỏ ra ngoài origin");
  }
  const missingLocale = await resolveMissingPage(request.nextUrl.pathname);
  if (missingLocale) return rewriteToNotFound(request, missingLocale);
  const response = handleI18nRouting(request);
  if (response.status !== 307) return response;
  return new NextResponse(null, { status: 301, headers: response.headers });
}

// Bỏ qua /admin, /api, /_next, file có đuôi (ảnh, sitemap.xml, robots.txt...). Khớp cả đúng `/admin` lẫn `/admin/...`.
export const config = {
  matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)"],
};
