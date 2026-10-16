"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Tải script Turnstile đúng 1 lần cho mọi widget trên trang; lỗi tải thì bỏ cache để lần sau thử lại. */
function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = (reason: string) => {
      script.remove();
      scriptPromise = null;
      reject(new Error(reason));
    };
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : fail("turnstile-missing"));
    script.onerror = () => fail("turnstile-script-failed");
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Chỉ cho test: xoá cache để mỗi test bắt đầu từ trạng thái "chưa tải script". */
export function resetTurnstileLoaderForTests() {
  scriptPromise = null;
}

type TurnstileWidgetProps = {
  /** Site key công khai (không phải secret). Thiếu thì không tải gì và báo `onUnavailable`. */
  siteKey?: string;
  /** Token mới, hoặc `null` khi token hết hạn/lỗi (form phải coi như chưa có token). */
  onToken: (token: string | null) => void;
  /** Script không tải được, thiếu site key hoặc widget báo lỗi. */
  onUnavailable?: () => void;
  /** Tăng giá trị này để xin token mới (token chỉ dùng được 1 lần: reset sau mỗi lần gửi). */
  resetSignal?: number;
};

/**
 * Cloudflare Turnstile (BR-16), render explicit. Script chỉ tải khi widget vào gần viewport (IntersectionObserver)
 * HOẶC có focus vào form chứa nó (design-spec §1.5), không tải khi trang chỉ được xem lướt.
 * `appearance: interaction-only` giữ widget ẩn trừ khi Cloudflare cần người dùng tương tác.
 */
export function TurnstileWidget({ siteKey, onToken, onUnavailable, resetSignal = 0 }: TurnstileWidgetProps) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Không có IntersectionObserver (trình duyệt cũ): tải luôn, vì không còn cách nào biết form đã vào viewport.
  const [wanted, setWanted] = useState(() => typeof IntersectionObserver === "undefined");
  // Callback đổi theo mỗi render của form cha; giữ qua ref để effect render widget không chạy lại.
  const callbacksRef = useRef({ onToken, onUnavailable });
  useEffect(() => {
    callbacksRef.current = { onToken, onUnavailable };
  }, [onToken, onUnavailable]);

  // Điều kiện tải: vào viewport (sớm 200px) hoặc focus bất kỳ ô nào trong form. 
  useEffect(() => {
    const container = containerRef.current;
    if (wanted || !container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setWanted(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    const focusTarget = container.closest("form") ?? container.parentElement;
    const onFocusIn = () => setWanted(true);
    focusTarget?.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      focusTarget?.removeEventListener("focusin", onFocusIn);
    };
  }, [wanted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!wanted || !container) return;
    if (!siteKey) {
      callbacksRef.current.onUnavailable?.();
      return;
    }
    let cancelled = false;
    let api: TurnstileApi | undefined;
    loadTurnstile().then(
      (loaded) => {
        if (cancelled) return;
        api = loaded;
        widgetIdRef.current = loaded.render(container, {
          sitekey: siteKey,
          language: locale,
          theme: "light",
          appearance: "interaction-only",
          callback: (token: string) => callbacksRef.current.onToken(token),
          // Hết hạn: bỏ token cũ; Turnstile mặc định tự làm mới token (refresh-expired: auto) nên không reset thủ công.
          "expired-callback": () => callbacksRef.current.onToken(null),
          "error-callback": () => {
            callbacksRef.current.onToken(null);
            callbacksRef.current.onUnavailable?.();
          },
        });
      },
      () => {
        if (!cancelled) callbacksRef.current.onUnavailable?.();
      },
    );
    return () => {
      cancelled = true;
      if (api && widgetIdRef.current) api.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [wanted, siteKey, locale]);

  const firstSignal = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === firstSignal.current) return;
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  return <div ref={containerRef} />;
}
