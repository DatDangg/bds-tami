"use client";

import { useEffect, type ReactNode } from "react";

const FLAG = "adminNavigatingAway";

/**
 * Payload AuthProvider toast "Fetching user failed: Failed to fetch" cho mọi fetch `/me` bị huỷ — kể cả khi chỉ vì
 * trang đang điều hướng toàn trang (F5, back, gõ URL). Provider này gắn cờ lên <html> từ `beforeunload` để CSS
 * (styles/_navigation-guard.scss) ẩn toast của trang sắp đóng. Cờ chỉ bật sau `beforeunload` nên lỗi mạng thật vẫn toast.
 */
export function NavigationToastGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const clearFlag = () => {
      delete root.dataset[FLAG];
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      root.dataset[FLAG] = "true";
      // Listener khác (form "chưa lưu" của Payload) có thể gọi preventDefault SAU listener này → hộp thoại xác nhận;
      // setTimeout(0) chạy sau khi toàn bộ listener đã xong (và sau khi người dùng chọn "ở lại") nên đọc được kết quả.
      setTimeout(() => {
        if (event.defaultPrevented) clearFlag();
      }, 0);
    };
    // Trang còn sống mà người dùng tương tác / bfcache khôi phục = điều hướng đã bị huỷ (vd. phản hồi tải file).
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pageshow", clearFlag);
    window.addEventListener("pointerdown", clearFlag);
    window.addEventListener("keydown", clearFlag);
    // `focus`: link mailto:/tel: mở app ngoài rồi người dùng quay lại tab → trang còn sống, cờ phải gỡ.
    // KHÔNG dùng timer (server chậm có thể giữ trang cũ 2–5s trước commit, fetch chỉ reject lúc commit → timer sẽ
    // gỡ cờ quá sớm và toast giả quay lại) và KHÔNG dùng visibilitychange→hidden (cũng bắn trong lúc unload).
    window.addEventListener("focus", clearFlag);
    return () => {
      window.removeEventListener("focus", clearFlag);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pageshow", clearFlag);
      window.removeEventListener("pointerdown", clearFlag);
      window.removeEventListener("keydown", clearFlag);
      clearFlag();
    };
  }, []);

  return children;
}
