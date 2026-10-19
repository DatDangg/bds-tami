"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { buildLocaleCookie } from "@/i18n/localeCookie";
import { type Locale, locales } from "@/i18n/routing";
import { localeSwitchHref } from "@/lib/i18n/counterpart-url";
import { cn } from "@/lib/utils";

/**
 * `VI | EN` (design-spec §2.3: mỗi mục là `<a hreflang lang>`). Ngôn ngữ đang xem: link về chính trang này, chữ đậm + `aria-current`
 * (tên truy cập "Tiếng Việt" đọc được vì là `<a>`, không phải `aria-label` trên phần tử generic). Mỗi mục ≥ 44×44, hai mục cách nhau ≥ 8px.
 * Ngôn ngữ kia: link tới TRANG TƯƠNG ỨNG (`localeSwitchHref`: trang luôn có hai bản link thẳng; trang có slug hoặc pháp lý qua `/api/locale-counterpart`,
 * chưa có bản dịch thì về danh sách/trang chủ) và ghi cookie `NEXT_LOCALE` để UI nhớ lựa chọn. Cookie KHÔNG được đọc để redirect: mỗi URL một ngôn ngữ (SPEC F12), nên link vẫn hoạt động khi chặn cookie.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale;
  const t = useTranslations("common");
  const pathname = usePathname();
  return (
    <div className={cn("flex items-center text-small font-semibold uppercase", className)} role="group" aria-label={t("switchLanguage")}>
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center">
          {index > 0 && <span aria-hidden="true" className="px-2 text-text-muted">|</span>}
          {locale === current ? (
            <a
              href={pathname}
              hrefLang={locale}
              lang={locale}
              aria-current="true"
              aria-label={t(`languageName.${locale}`)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center font-bold text-text"
            >
              {locale}
            </a>
          ) : (
            <a
              href={localeSwitchHref(pathname, locale)}
              hrefLang={locale}
              lang={locale}
              aria-label={t(`languageName.${locale}`)}
              onClick={() => {
                document.cookie = buildLocaleCookie(locale);
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center font-normal text-text underline-offset-4 hover:underline"
            >
              {locale}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
