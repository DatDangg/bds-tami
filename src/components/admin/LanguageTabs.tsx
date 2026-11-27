"use client";

import { useConfig, useEditDepth, useLocale, useRouteTransition } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

const LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh" };

/**
 * BL-133: hai tab ngôn ngữ đầu form. Bấm tab = đổi `?locale=` y như ô "Ngôn ngữ" của Payload (Localizer), nên lưu/không lưu cư xử giống hệt.
 * Không hiện trong drawer sửa nhanh (đổi locale sẽ rời trang đang mở).
 */
export function LanguageTabs() {
  const { config } = useConfig();
  const { code: current } = useLocale();
  const { startRouteTransition } = useRouteTransition();
  const router = useRouter();
  const editDepth = useEditDepth();
  const locales = config.localization ? config.localization.locales.map((locale) => locale.code) : [];
  if (editDepth > 1 || locales.length < 2) return null;

  const switchTo = (code: string) => {
    if (code === current) return;
    const params = new URLSearchParams(window.location.search);
    params.set("locale", code);
    startRouteTransition(() => router.push(`?${params.toString()}`));
  };

  return (
    <div className="tami-lang-tabs" role="tablist" aria-label="Ngôn ngữ đang sửa">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          role="tab"
          aria-selected={code === current}
          className={`tami-lang-tabs__tab tami-lang-tabs__tab--${code}${code === current ? " is-active" : ""}`}
          onClick={() => switchTo(code)}
        >
          {LABELS[code] ?? code}
        </button>
      ))}
    </div>
  );
}
