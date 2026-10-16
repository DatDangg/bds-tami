"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { createKeepAlive } from "../../lib/session/keepalive";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "mousemove"] as const;

/** Các màn không có phiên đăng nhập (chọn tường minh; `account`, `browseByFolder` vẫn cần làm mới). */
const ANONYMOUS_ROUTE_KEYS = ["login", "logout", "inactivity", "forgot", "reset", "createFirstUser", "unauthorized"] as const;

/**
 * Provider admin: làm mới token tối đa 1 lần/15 phút khi người dùng còn thao tác (PERMISSION §7).
 * Dùng `refreshCookieAsync` của Payload UI để timer phiên, tab khác và guard logout đều được xử lý;
 * lỗi 401/403 do Payload tự chuyển về màn inactivity nên không tự redirect ở đây.
 */
export function SessionKeepAlive({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const { config } = useConfig();
  const { refreshCookieAsync } = useAuth();
  const keepAliveRef = useRef<ReturnType<typeof createKeepAlive> | null>(null);
  // Giữ bản mới nhất để keepAlive (tạo một lần) luôn gọi đúng hàm của AuthProvider.
  const refreshRef = useRef(refreshCookieAsync);
  useEffect(() => {
    refreshRef.current = refreshCookieAsync;
  }, [refreshCookieAsync]);

  const adminRoute = config.routes.admin;
  const anonymousKey = ANONYMOUS_ROUTE_KEYS.map((key) => `${adminRoute}${config.admin.routes[key]}`).join("|");

  useEffect(() => {
    const isAnonymous = anonymousKey.split("|").some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (isAnonymous) return;
    keepAliveRef.current ??= createKeepAlive({
      refresh: () => refreshRef.current(),
      isVisible: () => document.visibilityState === "visible",
      now: () => Date.now(),
    });
    const keepAlive = keepAliveRef.current;
    const onActivity = () => void keepAlive.notifyActivity();
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true });
    // Đổi route cũng là một hoạt động.
    onActivity();
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
    };
  }, [pathname, anonymousKey]);

  return <>{children}</>;
}
