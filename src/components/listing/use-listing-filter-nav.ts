"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useReportPending } from "@/components/layout/PendingRegion";
import { type ListingParamPatch, listingHref, type RawListingParams } from "./listing-params";

/**
 * Điều hướng khi đổi một ô lọc (BL-052, "đổi ô lọc áp dụng ngay"): dựng URL mới bằng `listingHref` (giữ tham số khác, bỏ `page`) rồi `router.push` trong transition,
 * báo chờ lên `PendingRegion` gần nhất. Không cuộn về đầu trang (`scroll: false`) để người dùng đang ở bộ lọc không mất chỗ.
 * `path` đã có tiền tố ngôn ngữ; `current` = tham số đang trên URL do server đưa xuống (không dùng `useSearchParams` để khỏi cần Suspense).
 *
 * An toàn với người gọi trễ / gọi dồn:
 * - `navigate` ổn định và luôn đọc `current` MỚI NHẤT qua ref (hẹn giờ của thanh trượt gọi sau khi URL đã đổi vẫn giữ lọc vừa áp dụng).
 * - Các thay đổi chưa về tới URL được gom trong ref và gộp vào mỗi lần điều hướng (đổi hai ô liên tiếp không đè nhau).
 *   Ref xoá khi URL chuẩn hoá của `current` đổi, hoặc khi gọi `reset` (link "Xoá tất cả" có thể về đúng URL hiện tại).
 * Trang nên gọi hook MỘT lần, truyền `navigate` cho ô lọc của cả `FilterSidebar` lẫn `FilterSheet` và `reset` vào `onClear` của hai thành phần đó.
 * `generation` tăng mỗi lần `reset`: trang dùng làm `key` của nội dung bộ lọc để các ô dựng lại từ URL — huỷ hẹn giờ commit của thanh trượt
 * (không "sống lại" lọc cũ sau "Xoá tất cả") và bỏ giá trị lạc quan khi link xoá về đúng URL hiện tại (P1-T02 review r3 n1 / n3).
 */
export function useListingFilterNav(path: string, current: RawListingParams) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);
  const latest = useRef({ path, current });
  useLayoutEffect(() => {
    latest.current = { path, current };
  });
  const pendingPatch = useRef<ListingParamPatch>({});
  const [generation, setGeneration] = useState(0);
  const base = listingHref(path, current);
  useEffect(() => {
    pendingPatch.current = {};
  }, [base]);
  /** Bỏ các thay đổi đang gom: gắn vào link "Xoá tất cả" (`onClear` của `FilterSidebar`/`FilterSheet`) — link đó có thể về đúng URL hiện tại nên `base` không đổi. */
  const reset = useCallback(() => {
    pendingPatch.current = {};
    setGeneration((value) => value + 1);
  }, []);

  const navigate = useCallback(
    (patch: ListingParamPatch) => {
      const merged = { ...pendingPatch.current, ...patch };
      pendingPatch.current = merged;
      const { path: currentPath, current: currentParams } = latest.current;
      startTransition(() => router.push(listingHref(currentPath, currentParams, merged), { scroll: false }));
    },
    [router],
  );
  return { navigate, reset, generation, pending };
}
