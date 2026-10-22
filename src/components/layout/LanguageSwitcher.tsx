"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { buildLocaleCookie } from "@/i18n/localeCookie";
import { type Locale, locales } from "@/i18n/routing";
import { localeSwitchHref } from "@/lib/i18n/counterpart-url";
import { cn } from "@/lib/utils";
import { FlagIcon } from "./flag-icons";

/**
 * Hai cờ vuông VN / UK (BL-063, design-spec §2.3: mỗi mục là `<a hreflang lang aria-label title>` — tên truy cập "Tiếng Việt" / "English"
 * đọc được vì là `<a>`, không phải `aria-label` trên phần tử generic; cờ SVG là trang trí `aria-hidden`). Mỗi mục ≥ 44×44, hai mục kề nhau `gap-1`.
 * Ngôn ngữ đang xem: link về chính trang này, `aria-current` + ring 2px có offset (phân biệt bằng hình học, không chỉ màu).
 * Ngôn ngữ kia: mờ 60% (hover/focus 100%), link tới TRANG TƯƠNG ỨNG (`localeSwitchHref`: trang luôn có hai bản link thẳng; trang có slug hoặc pháp lý
 * qua `/api/locale-counterpart`, chưa có bản dịch thì về danh sách/trang chủ) và ghi cookie `NEXT_LOCALE` để UI nhớ lựa chọn.
 * Cookie KHÔNG được đọc để redirect: mỗi URL một ngôn ngữ (SPEC F12), nên link vẫn hoạt động khi chặn cookie.
 * `tone` chỉ chọn màu `ring-offset` theo nền đặt nút: header kính sáng (mặc định) · menu toàn màn hình + footer nền tối.
 * Vòng focus dùng quy tắc `:focus-visible` toàn site (globals.css; trong header đổi sang màu chữ) — không thêm lớp riêng.
 */
export function LanguageSwitcher({ className, tone = "on-light" }: { className?: string; tone?: "on-light" | "on-dark" }) {
  const current = useLocale() as Locale;
  const t = useTranslations("common");
  const pathname = usePathname();
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label={t("switchLanguage")}>
      {locales.map((locale) => {
        const isCurrent = locale === current;
        return (
          <a
            key={locale}
            href={isCurrent ? pathname : localeSwitchHref(pathname, locale)}
            hrefLang={locale}
            lang={locale}
            aria-label={t(`languageName.${locale}`)}
            title={t(`languageName.${locale}`)}
            aria-current={isCurrent ? "true" : undefined}
            onClick={isCurrent ? undefined : () => {
              document.cookie = buildLocaleCookie(locale);
            }}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full",
              !isCurrent && "opacity-60 transition-opacity duration-(--duration-fast) hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none",
            )}
          >
            {/* Viền mảnh ring-black/20 để cờ nét trên nền sáng lẫn tối (cờ đã đậm màu, không cần đổi viền theo nền). */}
            <span
              className={cn(
                "inline-flex size-6 overflow-hidden rounded-[2px] ring-1 ring-black/20",
                isCurrent && "ring-2 ring-accent-text ring-offset-2",
                isCurrent && (tone === "on-dark" ? "ring-offset-dark" : "ring-offset-glass"),
              )}
            >
              <FlagIcon locale={locale} className="size-6" />
            </span>
          </a>
        );
      })}
    </div>
  );
}
