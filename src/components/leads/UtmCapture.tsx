"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureUtm } from "@/lib/leads/utm";

/**
 * Island ghi UTM (BR-10) đặt ở khung mọi trang công khai: khách vào bất kỳ trang nào có `utm_*` thì được lưu, dù trang đó không có form.
 * Chạy khi mount và mỗi lần `pathname` đổi (soft navigation). Đọc `window.location.search` trong effect thay vì `useSearchParams`
 * để layout không bị CSR bailout / mất static. Không render gì.
 */
export function UtmCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureUtm(window.location.search);
  }, [pathname]);
  return null;
}
