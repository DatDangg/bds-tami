"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { X } from "@/components/icons";
import { announcementDismissedKey } from "@/lib/home/announcement-hash";
import type { AnnouncementView } from "@/lib/home/home-view";

/** Script chạy ngay khi trình duyệt parse HTML (trước paint): giấu thanh nếu khách đã đóng đúng nội dung này → không nháy, không dịch chuyển layout. */
const hideIfDismissedScript = (storageKey: string) =>
  `(function(){try{var bar=document.currentScript.parentElement;if(localStorage.getItem(${JSON.stringify(storageKey)})===bar.getAttribute("data-announcement-hash"))bar.style.display="none"}catch(e){}})()`;

function readDismissedHash(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null; // Chế độ riêng tư / chặn lưu trữ: coi như chưa đóng.
  }
}

function rememberDismissed(storageKey: string, hash: string) {
  try {
    localStorage.setItem(storageKey, hash);
  } catch {
    // Không lưu được thì chỉ đóng trong lần xem này.
  }
}

/** Đồng bộ giữa các tab: tab khác đóng cùng nội dung thì tab này ẩn theo. */
function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const subscribeNever = () => () => undefined;

/**
 * Thanh thông báo CHỈ ở trang chủ, đứng TRÊN CÙNG trang, phía trên header nổi (design-spec S01.1a; render ở PublicShell qua HomeAnnouncementBar, chỉ ở `/` · `/en`).
 * Nằm trong luồng, cuộn đi còn header vẫn dính. Chiều cao do chữ (tối thiểu 44px), render sẵn ở server nên không CLS lúc tải;
 * khách đã đóng đúng nội dung được giấu bằng script inline TRƯỚC paint (không dịch chuyển vì chưa từng vẽ), state React khớp lại sau hydrate.
 * Bấm đóng làm nội dung dịch lên: do người dùng chủ động nên không tính CLS.
 * Hero kéo lên chỉ theo `--header-offset` (xuống dưới header), không liên quan thanh này nên công thức offset không đổi.
 * Nền `--color-primary` + chữ `--color-primary-foreground` (AA).
 */
export function AnnouncementBar({ announcement }: { announcement: AnnouncementView }) {
  const t = useTranslations("page.home.announcement");
  const storageKey = announcementDismissedKey(useLocale());
  const { text, href, external, hash } = announcement;
  // Trên server luôn `false` (HTML có thanh); client khớp lại ngay sau hydrate mà không cần setState trong effect.
  const dismissedBefore = useSyncExternalStore(subscribeToStorage, () => readDismissedHash(storageKey) === hash, () => false);
  // Đóng trong phiên này kể cả khi không ghi được localStorage.
  const [closedNow, setClosedNow] = useState(false);
  // `true` ở server và lượt hydrate đầu, `false` ở mọi lần render client sau đó: chỉ HTML server mang <script> (script do React dựng ở client không chạy
  // và React 19 báo lỗi dev "script tag"; điều hướng client tới "/" không cần script vì state ở trên đã đủ).
  const serverPass = useSyncExternalStore(subscribeNever, () => false, () => true);

  if (dismissedBefore || closedNow) return null;
  return (
    // suppressHydrationWarning: script inline có thể đã đặt `style="display:none"` trước khi React hydrate.
    <section aria-label={t("label")} data-announcement-hash={hash} suppressHydrationWarning className="bg-primary text-primary-foreground print:hidden">
      <div className="mx-auto flex min-h-11 w-full max-w-container items-center pr-1 pl-gutter">
        <p className="flex-1 py-2 text-center text-small font-medium text-balance">
          {href ? (
            <Link
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rounded-sm px-1 font-semibold transition-colors duration-(--duration-fast) hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
            >
              {text}
            </Link>
          ) : (
            text
          )}
        </p>
        <button
          type="button"
          aria-label={t("close")}
          onClick={() => {
            rememberDismissed(storageKey, hash);
            setClosedNow(true);
          }}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-(--duration-fast) hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-foreground"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {serverPass && <script dangerouslySetInnerHTML={{ __html: hideIfDismissedScript(storageKey) }} />}
    </section>
  );
}
