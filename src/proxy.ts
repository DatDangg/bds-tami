import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// next-intl trả 307 khi chuẩn hoá URL (vd `/vi/du-an` → `/du-an`); đây là chuyển hướng vĩnh viễn nên đổi sang 301.
export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  if (response.status !== 307) return response;
  return new NextResponse(null, { status: 301, headers: response.headers });
}

// Bỏ qua /admin, /api, /_next, file có đuôi (ảnh, sitemap.xml, robots.txt...). Khớp cả đúng `/admin` lẫn `/admin/...`.
export const config = {
  matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)"],
};
