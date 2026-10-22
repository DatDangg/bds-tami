"use client";

import { useField } from "@payloadcms/ui";

import { describeSeoDescriptionLength, describeSeoTitleLength, type SeoLengthHint } from "@/lib/admin/seo";

function Hint({ hint }: { hint: SeoLengthHint }) {
  return (
    <p className={`tami-field-hint${hint.outOfRange ? " tami-field-hint--warn" : ""}`} aria-live="polite">
      {hint.text}
    </p>
  );
}

/** Bộ đếm dưới ô "Tiêu đề hiện trên Google": "N ký tự · nên ≤ 60". Chỉ nhắc, không chặn lưu (BL-058 T05). */
export function SeoTitleCounter({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  return <Hint hint={describeSeoTitleLength(value)} />;
}

/** Bộ đếm dưới ô "Mô tả hiện trên Google": "N ký tự · nên 120–160". Chỉ nhắc, không chặn lưu (BL-058 T05). */
export function SeoDescriptionCounter({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  return <Hint hint={describeSeoDescriptionLength(value)} />;
}
