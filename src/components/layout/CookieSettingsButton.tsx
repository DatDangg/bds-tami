"use client";

import { useTranslations } from "next-intl";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./cookie-settings-event";

export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("layout.footer");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      {t("cookieSettings")}
    </button>
  );
}
