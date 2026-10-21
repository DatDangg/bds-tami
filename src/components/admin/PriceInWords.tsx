"use client";

import { useField } from "@payloadcms/ui";

import { formatPriceInWords } from "@/lib/admin/list-summary";

/** Dòng đọc giá bằng chữ dưới ô số tiền: "≈ 3,5 tỷ đồng" để người nhập soát số 0 thừa/thiếu. Trống/0 thì không hiện (BL-042). */
export function PriceInWords({ path }: { path: string }) {
  const { value } = useField<number>({ path });
  const words = formatPriceInWords(value);
  return (
    <p className="tami-field-hint" aria-live="polite">
      {words}
    </p>
  );
}
