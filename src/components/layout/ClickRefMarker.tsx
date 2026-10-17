"use client";

import { useEffect } from "react";
import type { ClickRefCollection } from "@/lib/click-stats/click-types";

export interface ClickRef {
  collection: ClickRefCollection;
  id: string;
}

// `FloatingContact` nằm ở layout (ngoài trang) nên không nhận được props từ trang chi tiết; trang khai bản ghi đang xem qua marker này
// và nút nổi đọc lúc bấm. Biến module (không phải state) vì không có gì cần render lại khi đổi.
let currentRef: ClickRef | null = null;

/** Bản ghi mà trang hiện tại đang xem (để thống kê bấm nút nổi theo dự án/tin), `null` ở trang không gắn bản ghi. */
export function getClickRef(): ClickRef | null {
  return currentRef;
}

/** Đặt bản ghi cho thống kê lượt bấm nút nổi khi trang chi tiết đang hiện; gỡ khi rời trang. Không render gì. */
export function ClickRefMarker({ collection, id }: ClickRef) {
  useEffect(() => {
    const own: ClickRef = { collection, id };
    currentRef = own;
    return () => {
      // Trang mới có thể đã đặt ref của nó trước khi cleanup trang cũ chạy: chỉ gỡ ref của chính mình.
      if (currentRef === own) currentRef = null;
    };
  }, [collection, id]);
  return null;
}
