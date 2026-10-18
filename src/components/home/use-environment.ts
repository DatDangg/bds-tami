"use client";

import { useCallback, useSyncExternalStore } from "react";

// Trước khi hydrate / trên server mọi điều kiện là `false`: HTML server không có video và không tự chạy autoplay.
const falseOnServer = () => false;

/** `window.matchMedia(query).matches`, cập nhật khi đổi (đổi cỡ cửa sổ, bật reduced-motion). Không có `matchMedia` (jsdom) thì `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => typeof window.matchMedia === "function" && window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, falseOnServer);
}

type NetworkInformationLike = { saveData?: boolean; addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
const getConnection = () => (navigator as Navigator & { connection?: NetworkInformationLike }).connection;

/** Người dùng bật chế độ tiết kiệm dữ liệu (Save-Data): không tải video. */
export function useSaveData(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const connection = getConnection();
    connection?.addEventListener?.("change", onChange);
    return () => connection?.removeEventListener?.("change", onChange);
  }, []);
  return useSyncExternalStore(subscribe, () => Boolean(getConnection()?.saveData), falseOnServer);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** Tab đang hiện (autoplay dừng khi tab ẩn). Trên server coi là hiện. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}
