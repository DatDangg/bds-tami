"use client";

import { useField } from "@payloadcms/ui";

import { collectionDisplayName } from "../../lib/admin/collection-labels";

/** Mô tả dưới ô mã collection (read-only) ở màn chi tiết: hiện tên tiếng Việt, không thay ô nhập (BL-043). */
export function CollectionNameHint({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  if (typeof value !== "string" || value === "") return null;
  const name = collectionDisplayName(value);
  if (name === value) return null; // slug lạ: không có gì để thêm ngoài mã đang hiện trong ô
  return <div className="field-description">Tên gọi: {name}</div>;
}
