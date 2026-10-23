"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";

/** Thời gian khách ở trên site trước khi popup tự mở. Cố định trong code (không cấu hình admin, BL-066). */
export const POPUP_DELAY_MS = 30_000;
/** Mốc bắt đầu phiên (epoch ms, ghi lần đầu vào site): đồng hồ 30s tính từ đây nên chuyển trang không reset. */
export const CONSULT_POPUP_STARTED_KEY = "tami.consultPopup.startedAt";
/** Cờ "đã hiện trong phiên", ghi ngay khi mở: đóng hay gửi đều không hiện lại. */
export const CONSULT_POPUP_SHOWN_KEY = "tami.consultPopup.shown";

/** Đường dẫn thật (có tiền tố `/en`) của trang Liên hệ vi + en; trang này đã có form tư vấn nên popup không chen vào. */
const CONTACT_PATHS = new Set(["/lien-he", "/en/contact"]);
const OPEN_MODAL_SELECTOR = '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"]';
const RECHECK_MS = 250;
const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

interface ConsultPopupProps {
  /** Site key Turnstile (công khai) — cùng nguồn với form trang Liên hệ. */
  turnstileSiteKey?: string;
  hotline?: { label: string; telHref: string };
}

function isContactPath(pathname: string | null): boolean {
  const normalized = (pathname ?? "").replace(/\/+$/, "") || "/";
  return CONTACT_PATHS.has(normalized);
}

/**
 * Đọc trạng thái phiên; lần đầu vào site thì ghi mốc bắt đầu. `null` khi sessionStorage không dùng được (chặn, đầy, không có)
 * → popup không hiện, vì không đảm bảo được "1 lần / phiên".
 */
function readSession(now: number): { remainingMs: number; shown: boolean } | null {
  try {
    const shown = window.sessionStorage.getItem(CONSULT_POPUP_SHOWN_KEY) === "1";
    const stored = Number(window.sessionStorage.getItem(CONSULT_POPUP_STARTED_KEY));
    const startedAt = Number.isFinite(stored) && stored > 0 ? stored : now;
    if (startedAt === now) window.sessionStorage.setItem(CONSULT_POPUP_STARTED_KEY, String(now));
    const elapsed = Math.max(0, now - startedAt);
    return { remainingMs: Math.max(0, POPUP_DELAY_MS - elapsed), shown };
  } catch {
    return null;
  }
}

function markShown(): boolean {
  try {
    window.sessionStorage.setItem(CONSULT_POPUP_SHOWN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/** `<form>` của trang mà khách đang gõ trong ô nhập (không được cướp focus giữa chừng), hoặc `null`. */
function formBeingTypedIn(): HTMLFormElement | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body || !active.matches(TEXT_INPUT_SELECTOR)) return null;
  return active.closest("form");
}

/**
 * Chờ tới khi không còn gì chặn rồi gọi `onClear` (gọi ngay nếu đang không bị chặn); trả hàm huỷ. Bị chặn khi:
 * có dialog/modal khác đang mở (lightbox, menu mobile — không mở chồng); focus còn nằm trong `form` đã nhớ (kể cả khi Tab sang nút gửi /
 * Turnstile cùng form); đang nhấn chuột trong `form` (Safari bấm nút không chuyển focus nên chỉ xét focus là không đủ). Kiểm theo chu kỳ ngắn
 * thay vì nghe nhiều loại sự kiện: ít code nhất, và độ trễ ≤ 250ms không ai thấy.
 */
function whenUnblocked(form: HTMLFormElement | null, onClear: () => void): () => void {
  let pointerInForm = false;
  const onPointerDown = (event: Event) => {
    pointerInForm = form !== null && event.target instanceof Node && form.contains(event.target);
  };
  const onPointerEnd = () => {
    pointerInForm = false;
  };
  const isBlocked = () =>
    pointerInForm || document.querySelector(OPEN_MODAL_SELECTOR) !== null || (form !== null && form.contains(document.activeElement));
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointerup", onPointerEnd, true);
  document.addEventListener("pointercancel", onPointerEnd, true);
  const poll = setInterval(check, RECHECK_MS);
  function dispose() {
    clearInterval(poll);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointerup", onPointerEnd, true);
    document.removeEventListener("pointercancel", onPointerEnd, true);
  }
  function check() {
    if (isBlocked()) return;
    dispose();
    onClear();
  }
  check();
  return dispose;
}

/**
 * Popup "Nhận tư vấn" (BL-066): tự mở sau 30s khách ở trên site, tối đa 1 lần / phiên trình duyệt, ở mọi trang công khai trừ Liên hệ.
 * Island client trong `PublicShell` (chỉ dùng `usePathname`, không `useSearchParams`) nên không làm trang công khai thành dynamic.
 * Đồng hồ theo mốc phiên trong sessionStorage; mỗi lần đổi trang tính lại phần còn lại. Tới mốc mà khách đang gõ ở form khác (focus còn trong form đó) hoặc đang có modal khác mở thì hoãn
 * tới khi hết chặn. Nội dung là `LeadForm` với nguồn `popup` (cùng consent, Turnstile, rate limit, chống trùng như form khác).
 */
export function ConsultPopup({ turnstileSiteKey, hotline }: ConsultPopupProps) {
  const t = useTranslations("form.consultPopup");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Dialog không có nút mở (Trigger) nên Radix không có chỗ trả focus: tự nhớ phần tử đang focus lúc mở.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Đọc phiên TRƯỚC khi loại trang Liên hệ: mốc bắt đầu phải ghi từ lần vào site đầu tiên dù đó là /lien-he.
    const session = readSession(Date.now());
    if (!session || session.shown || isContactPath(pathname)) return;

    let stopWaiting: (() => void) | undefined;
    const show = () => {
      if (!markShown()) return;
      returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const timer = setTimeout(() => {
      stopWaiting = whenUnblocked(formBeingTypedIn(), show);
    }, session.remainingMs);

    return () => {
      clearTimeout(timer);
      stopWaiting?.();
    };
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        closeLabel={t("close")}
        className="max-w-md p-5 md:p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusTo.current?.isConnected) returnFocusTo.current.focus();
        }}
      >
        <DialogTitle className="pr-10">{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
        <LeadForm source="popup" layout="compact" {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
      </DialogContent>
    </Dialog>
  );
}
