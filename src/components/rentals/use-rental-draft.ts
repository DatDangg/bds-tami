"use client";

import { useEffect, useRef, useState } from "react";
import { parseRentalFilters, type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";

/** Giá trị các ô lọc dạng chuỗi (đúng thứ người dùng đang gõ); `""` = bỏ trống. */
export type FilterDraft = {
  q: string;
  category: string;
  province: string;
  ward: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  bedrooms: string;
  furnishing: string;
  sort: string;
};

/** Gõ chữ/số thì chờ 300ms mới đổi URL (design-spec §3.5); chọn/bấm chip thì đổi ngay. */
export const TYPING_DEBOUNCE_MS = 300;

export const draftOf = (filters: RentalFilters): FilterDraft => ({
  q: filters.q ?? "",
  category: filters.category ?? "",
  province: filters.province ?? "",
  ward: filters.ward ?? "",
  priceMin: filters.priceMin === undefined ? "" : String(filters.priceMin),
  priceMax: filters.priceMax === undefined ? "" : String(filters.priceMax),
  areaMin: filters.areaMin === undefined ? "" : String(filters.areaMin),
  areaMax: filters.areaMax === undefined ? "" : String(filters.areaMax),
  bedrooms: filters.bedrooms === undefined ? "" : String(filters.bedrooms),
  furnishing: filters.furnishing ?? "",
  sort: filters.sort,
});

/** Cùng bộ phân tích với URL: giá trị sai bị bỏ, khoảng đảo ngược được đảo lại; luôn về trang 1 (query không có `page`). */
export const queryOfDraft = (draft: FilterDraft): string => rentalListQueryString(parseRentalFilters(draft));

/**
 * Bộ lọc "áp dụng ngay" (thanh lọc desktop + thanh dính mobile): đổi ô → cập nhật `draft`, rồi đổi URL ngay hoặc sau 300ms khi đang gõ.
 * URL là nguồn sự thật: đổi từ NGOÀI (bỏ chip lọc, nút Xoá, back/forward) thì `draft` được nạp lại từ URL; còn URL đổi do chính lần commit của
 * hook (kể cả khi người dùng đã gõ thêm trong lúc chờ server) thì KHÔNG nạp lại, tránh nuốt chữ đang gõ.
 */
export function useLiveDraft(filters: RentalFilters, navigate: (query: string) => void) {
  const urlQuery = rentalListQueryString({ ...filters, page: 1 });
  const [draft, setDraft] = useState(() => draftOf(filters));
  const [sync, setSync] = useState({ url: urlQuery, committed: urlQuery });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (sync.url !== urlQuery) {
    const external = urlQuery !== sync.committed;
    setSync({ url: urlQuery, committed: external ? urlQuery : sync.committed });
    if (external) setDraft(draftOf(filters));
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(next: FilterDraft) {
    const query = queryOfDraft(next);
    // So với lần commit gần nhất (không phải URL hiện tại): URL có thể còn cũ trong lúc server dựng lại, mà người dùng đã đổi ý.
    if (query === sync.committed) return;
    setSync((current) => ({ ...current, committed: query }));
    navigate(query);
  }

  function update(patch: Partial<FilterDraft>, mode: "now" | "typing") {
    const next = { ...draft, ...patch };
    setDraft(next);
    clearTimeout(timer.current);
    if (mode === "now") commit(next);
    else timer.current = setTimeout(() => commit(next), TYPING_DEBOUNCE_MS);
  }

  return { draft, update };
}
