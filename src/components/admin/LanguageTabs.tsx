"use client";

import { useConfig, useEditDepth, useFormFields, useLocale, useRouteTransition } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

import { englishTabStatus } from "@/lib/translation/admin-ui";

const LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh" };

const useTranslationField = (name: string) => useFormFields(([fields]) => fields[`translation.${name}`]?.value);

/**
 * BL-133: hai tab ngôn ngữ đầu form. Bấm tab = đổi `?locale=` y như ô "Ngôn ngữ" của Payload (Localizer), nên lưu/không lưu cư xử giống hệt.
 * Tab Tiếng Anh kèm trạng thái bản tiếng Anh đọc từ `translation.*`. Không hiện trong drawer sửa nhanh (đổi locale sẽ rời trang đang mở).
 */
export function LanguageTabs() {
  const { config } = useConfig();
  const { code: current } = useLocale();
  const { startRouteTransition } = useRouteTransition();
  const router = useRouter();
  const editDepth = useEditDepth();
  const status = englishTabStatus({
    status: useTranslationField("status"),
    enSource: useTranslationField("enSource"),
    viChangedAfterManual: useTranslationField("viChangedAfterManual"),
  });
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
          {code === "en" && status ? <span className={`tami-lang-tabs__status tami-lang-tabs__status--${status.tone}`}>{status.label}</span> : null}
        </button>
      ))}
    </div>
  );
}
