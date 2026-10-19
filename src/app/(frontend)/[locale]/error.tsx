"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";
import { WarningCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import { reportClientError } from "@/lib/monitoring/report-client-error";
import type { Locale } from "@/i18n/routing";

/**
 * 500 theo ngôn ngữ đang xem (design-spec S18): lỗi render một route, header/footer vẫn còn. Không hiện stack, chỉ `digest`
 * để khách đọc cho tổng đài. Hotline lấy từ `NEXT_PUBLIC_HOTLINE` (biến build, giống `global-error`) vì lỗi có thể do DB.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("page.serverError");
  const locale = useLocale() as Locale;
  const hotline = process.env.NEXT_PUBLIC_HOTLINE?.trim();
  useEffect(() => reportClientError(error), [error]);
  return (
    <div className="mx-auto flex w-full max-w-container flex-col items-center gap-4 px-gutter py-section-tight text-center">
      <WarningCircle size={40} aria-hidden="true" className="text-text-muted" />
      <h1 className="font-display text-h1">{t("title")}</h1>
      <p className="max-w-[60ch] text-body text-text-secondary">
        {hotline ? t("descriptionWithHotline", { hotline }) : t("description")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="dark" onClick={reset}>
          {t("retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href={resolveNavLink("home", locale)?.href ?? "/"}>{t("backHome")}</Link>
        </Button>
      </div>
      {error.digest && <p className="text-xsmall text-text-muted">{t("errorCode", { digest: error.digest })}</p>}
    </div>
  );
}
