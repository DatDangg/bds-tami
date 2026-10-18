import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { publicPath } from "@/lib/content/content-paths";
import { LOCALE_COUNTERPART_ENDPOINT } from "@/lib/i18n/counterpart-url";
import { resolveCounterpartPath } from "@/lib/i18n/resolve-counterpart";
import { logger } from "@/lib/logger";

// Route tĩnh `/api/locale-counterpart` được Next ưu tiên hơn catch-all `/api/[...slug]` của Payload.
export const dynamic = "force-dynamic";

const MAX_PATH_LENGTH = 300;
/** Cache ngắn ở CDN: đủ giảm tải DB, bản dịch vừa xuất bản hiện ra sau tối đa 1 phút (như ISR của trang). */
const CACHE_CONTROL = "public, max-age=0, s-maxage=60";

/**
 * Nút chuyển ngôn ngữ của trang có slug (`LanguageSwitcher`): `?to=en&path=/cho-thue/ten-tin` → 302 tới trang tương ứng
 * ngôn ngữ kia, hoặc danh sách/trang chủ khi chưa có bản dịch. `Location` luôn là đường dẫn tương đối do server dựng.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");
  const path = searchParams.get("path") ?? "";
  if (!hasLocale(routing.locales, to) || !path.startsWith("/") || path.length > MAX_PATH_LENGTH) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const location = await resolveCounterpartPath(path, to);
    return new Response(null, { status: 302, headers: { Location: location, "Cache-Control": CACHE_CONTROL } });
  } catch (error) {
    logger.error({ err: error, path, to }, `${LOCALE_COUNTERPART_ENDPOINT}: không tra được trang tương ứng, về trang chủ`);
    // Không cache: lỗi DB thoáng qua không được thành redirect sai kéo dài ở CDN.
    return new Response(null, { status: 302, headers: { Location: publicPath("/", to), "Cache-Control": "no-store" } });
  }
}
