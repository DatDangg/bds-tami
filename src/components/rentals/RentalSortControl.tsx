"use client";

import { useRentalListNavigation } from "./RentalListNavigation";
import { SortSelect } from "./SortSelect";

/**
 * Ô Sắp xếp ở hàng "Có N kết quả": dùng CHUNG bản nháp với băng tìm kiếm, nên đổi là đổi URL ngay, giữ mọi bộ lọc (kể cả lọc vừa chọn mà server chưa trả về
 * và từ khoá đang chờ debounce) và về trang 1. Nhãn chỉ hiện từ `sm` (< sm chỉ còn nhãn cho trình đọc màn hình) để giá trị chọn đọc được ở 375px.
 */
export function RentalSortControl() {
  const { draft, update } = useRentalListNavigation();
  return <SortSelect id="rental-sort" value={draft.sort} onChange={(sort) => update({ sort }, "now")} labelClassName="max-sm:sr-only" className="min-w-0 flex-1 flex-row items-center justify-end gap-3 sm:flex-none" selectClassName="w-full min-w-[11rem] sm:w-56" />;
}
