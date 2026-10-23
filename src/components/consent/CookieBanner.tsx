"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/layout/cookie-settings-event";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  CONSENT_CHANGED_EVENT,
  currentConsent,
  isValidGaMeasurementId,
  parseConsent,
  readRawConsent,
  writeConsent,
} from "@/lib/consent/consent-cookie";
import { ConsentPreferences } from "./ConsentPreferences";

export interface ConsentConfig {
  /** `site-settings.gaMeasurementId`; rỗng/không hợp lệ → không có cookie phân tích để xin → không banner, không GA4. */
  gaMeasurementId: string | null;
  /** `site-settings.privacyPolicyVersion`; đổi giá trị → hỏi lại. */
  privacyPolicyVersion: string;
}

/** Biến CSS mà FloatingContact cộng vào `bottom` để không bị banner (dưới `md`) đè. */
const FLOATING_OFFSET_VAR = "--floating-bottom-offset";
const MD_MEDIA_QUERY = "(min-width: 768px)";
const OFFSET_GAP_PX = 8;

/**
 * Đặt `--floating-bottom-offset` trên `<html>` = chiều cao banner (+ khe 8px) khi banner hiện dưới `md`.
 * Từ `md` banner ở góc trái nên gỡ biến. Gỡ luôn khi banner đóng (hook chạy cleanup lúc unmount).
 */
function useFloatingOffset(element: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const root = document.documentElement;
    const media = window.matchMedia(MD_MEDIA_QUERY);
    const update = () => {
      if (media.matches) root.style.removeProperty(FLOATING_OFFSET_VAR);
      else root.style.setProperty(FLOATING_OFFSET_VAR, `${Math.ceil(node.getBoundingClientRect().height) + OFFSET_GAP_PX}px`);
    };
    update();
    media.addEventListener("change", update);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => {
      media.removeEventListener("change", update);
      observer?.disconnect();
      root.style.removeProperty(FLOATING_OFFSET_VAR);
    };
  }, [element]);
}

/** Giá trị cookie chưa biết (server / lần render hydrate đầu): không render gì để HTML giống nhau cho mọi khách. */
const UNREAD = Symbol("consent-unread");

function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
}

/**
 * Quản lý đồng ý cookie (design-spec §3.10): banner nổi + dialog Tuỳ chọn + chèn GA4 sau đồng ý.
 * Cookie chỉ được đọc SAU hydrate (`decided === undefined` = chưa biết → không render gì), nên HTML server giống nhau
 * cho mọi khách và CDN cache được.
 */
export function CookieBanner({ gaMeasurementId, privacyPolicyVersion }: ConsentConfig) {
  const hasAnalytics = isValidGaMeasurementId(gaMeasurementId);
  const rawCookie = useSyncExternalStore<string | null | typeof UNREAD>(subscribeConsent, readRawConsent, () => UNREAD);
  // undefined: chưa đọc cookie · null: chưa chọn (hỏng / hết hạn / đổi chính sách) · boolean: lựa chọn analytics đã lưu
  const decided = useMemo(
    () => (rawCookie === UNREAD ? undefined : (currentConsent(parseConsent(rawCookie), privacyPolicyVersion)?.analytics ?? null)),
    [rawCookie, privacyPolicyVersion],
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const openerRef = useRef<Element | null>(null);

  const openPreferences = useCallback(() => {
    openerRef.current = document.activeElement;
    setPreferencesOpen(true);
  }, []);

  useEffect(() => {
    if (!hasAnalytics) return;
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPreferences);
  }, [hasAnalytics, openPreferences]);

  // Dialog không có DialogTrigger nên Radix tự không trả focus về đâu cả (rơi về body). Tự trả về nút đã mở dialog;
  // nút "Tuỳ chọn" của banner biến mất sau khi lưu → chuyển về `main` để bàn phím không mất vị trí.
  const restoreFocus = useCallback((event: Event) => {
    event.preventDefault();
    const opener = openerRef.current;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    else document.getElementById("main")?.focus();
  }, []);

  const choose = useCallback(
    (analytics: boolean) => {
      writeConsent(analytics, privacyPolicyVersion);
      setPreferencesOpen(false);
    },
    [privacyPolicyVersion],
  );

  if (!hasAnalytics) return null;
  return (
    <>
      {/* Chỉ hành động khi đã đọc cookie: render hydrate đầu (decided undefined) mà truyền enabled=false sẽ xoá `_ga` của khách đã đồng ý. */}
      {decided !== undefined && <GoogleAnalytics measurementId={gaMeasurementId} enabled={decided === true} />}
      {decided === null && <Banner onChoose={choose} onPreferences={openPreferences} />}
      <ConsentPreferences
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
        analytics={decided === true}
        onSave={choose}
        onCloseAutoFocus={restoreFocus}
      />
    </>
  );
}

/**
 * Thanh nổi đáy: < md toàn chiều rộng cách đáy 8px; ≥ md hộp 420px góc trái. Region (không phải dialog), không bẫy focus.
 * Hai nút cùng cấp, cùng cỡ (`flex-1`), không làm nổi "Đồng ý" hơn "Từ chối" (LGL-03).
 */
function Banner({ onChoose, onPreferences }: { onChoose: (analytics: boolean) => void; onPreferences: () => void }) {
  const t = useTranslations("layout.consent");
  const ref = useRef<HTMLElement | null>(null);
  useFloatingOffset(ref);
  return (
    <section
      ref={ref}
      aria-label={t("region")}
      className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-(--z-cookie) flex flex-col gap-3 rounded-sm bg-surface p-4 text-text shadow-lg md:right-auto md:bottom-4 md:left-4 md:w-[420px] print:hidden"
    >
      <p className="text-small">
        {t("message")}{" "}
        <Link
          href="/chinh-sach-bao-mat"
          className="inline-flex min-h-11 items-center font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text"
        >
          {t("privacyLink")}
        </Link>
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => onChoose(false)}>
          {t("decline")}
        </Button>
        <Button variant="dark" className="flex-1" onClick={() => onChoose(true)}>
          {t("accept")}
        </Button>
      </div>
      <button
        type="button"
        onClick={onPreferences}
        className="inline-flex min-h-11 cursor-pointer items-center self-start text-small font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text"
      >
        {t("preferences")}
      </button>
    </section>
  );
}
