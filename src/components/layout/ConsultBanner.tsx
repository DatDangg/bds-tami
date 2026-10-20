import { getTranslations } from "next-intl/server";
import { CtaBanner } from "@/components/home/CtaBanner";
import type { Locale } from "@/i18n/routing";
import { getHomepage } from "@/lib/content/get-globals";
import { buildCtaBannerView } from "@/lib/home/home-view";
import { logger } from "@/lib/logger";
import type { Homepage } from "@/payload-types";

interface ConsultBannerProps {
  locale: Locale;
  /** Mặc định theo CMS (→ `/lien-he`); trang chi tiết dự án truyền `#lead-form` để nút cuộn tới form tại chỗ. */
  actionHref?: string;
  /** Nút phụ (vd gọi hotline `tel:`) thay cho nút phụ của CMS; thiếu thì giữ nút phụ CMS (nếu có). */
  secondary?: { label: string; href: string };
}

/**
 * Banner tư vấn cuối trang con (BL-045, mockup `.cta`): dùng đúng nội dung `homepage.ctaBanner` ở ngôn ngữ đang xem, KHÔNG xét `enabled`/`blockOrder`
 * của trang chủ (khối trang chủ tắt vẫn có banner ở trang con). Chữ trống (vd `/en` chưa dịch, đọc không fallback) → chuỗi i18n mặc định `page.consult.*`;
 * thiếu ảnh → nền tối token (`CtaBanner`). Homepage lỗi → vẫn hiện bản mặc định. Server Component; cache theo tag homepage nhờ `get-globals`.
 */
export async function ConsultBanner({ locale, actionHref, secondary }: ConsultBannerProps) {
  const t = await getTranslations({ locale, namespace: "page.consult" });
  let homepage: Pick<Homepage, "ctaBanner"> = {};
  try {
    homepage = await getHomepage(locale);
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được homepage cho banner tư vấn, dùng chữ mặc định");
  }
  const view = buildCtaBannerView(homepage, locale);
  return <CtaBanner block={{ ...view, title: view.title || t("title"), description: view.description ?? t("description"), href: actionHref ?? view.href, ...(secondary ? { secondary } : {}) }} />;
}
