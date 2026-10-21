"use client";

import { useEffect } from "react";

/**
 * Vào `/cho-thue` từ nút tìm kiếm của header (`?q=` rỗng, `searchHrefFor`): đưa con trỏ vào ô từ khoá của `ListingHero` để gõ ngay (hành vi có từ BL-020, giữ ở BL-052).
 * `ListingHero` là Server Component dùng chung nên trang gắn thêm phần tử này thay vì thêm prop cho hero. Không render gì.
 */
export function FocusListingSearch() {
  useEffect(() => {
    document.querySelector<HTMLInputElement>('form[role="search"] input[name="q"]')?.focus();
  }, []);
  return null;
}
