import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PublicDocument } from "@/components/layout/PublicDocument";
import type { Locale } from "@/i18n/routing";
import NotFoundContent from "./(frontend)/[locale]/not-found";
import "./(frontend)/globals.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * 404 cho URL không khớp route nào (`/en/khong-ton-tai`, `/khong-ton-tai`): Next dựng thẳng trang này bằng SSR đầy đủ nên HTML server có
 * `h1` đúng ngôn ngữ + header/footer (`notFound()` ném từ trang thì chỉ cho shell rỗng). Ngôn ngữ lấy từ header do `proxy.ts` đặt, thiếu thì vi.
 * Bật bằng `experimental.globalNotFound` trong next.config.ts; xem ARCHITECTURE §5.1 (layer-6-task-03).
 */
export default async function GlobalNotFound() {
  const locale = (await getLocale()) as Locale;
  return (
    <PublicDocument locale={locale}>
      <NotFoundContent />
    </PublicDocument>
  );
}
