"use client";

import { useListRelationships } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type MediaDoc = { id?: string | number; url?: string | null; thumbnailURL?: string | null; sizes?: { thumb?: { url?: string | null } } };

/** Ảnh đầu của `gallery` (mảng id) hoặc `cover` (một id); list view của Payload để depth 0 nên thường là id, nhưng chấp nhận cả object đã populate. */
export function firstMediaRef(cellData: unknown): string | number | MediaDoc | undefined {
  const first = Array.isArray(cellData) ? cellData[0] : cellData;
  return typeof first === "string" || typeof first === "number" || (typeof first === "object" && first !== null) ? first : undefined;
}

/** Size nhỏ nhất `thumb` (400px, webp) của Media; thiếu thì dùng thumbnailURL/url gốc. */
export function pickThumbnailUrl(doc: MediaDoc | null | false | undefined): string | undefined {
  if (!doc) return undefined;
  return doc.sizes?.thumb?.url || doc.thumbnailURL || doc.url || undefined;
}

/**
 * Ô ảnh đại diện 40×40 (design §4). Không gọi API riêng cho từng dòng: `useListRelationships` của Payload gom các id
 * media của cả trang thành MỘT request `GET /api/media?where[id][in]=…&depth=0` (media đọc công khai nên không lộ thêm dữ liệu).
 * Thiếu ảnh / chưa tải / ảnh hỏng → khung trung tính (N8). Trang trí: alt rỗng, tiêu đề ở cột kế (TitleLinkCell).
 */
export function ThumbnailCell({ cellData }: { cellData?: unknown }) {
  const ref = firstMediaRef(cellData);
  const populated = typeof ref === "object" ? ref : undefined;
  const id = typeof ref === "object" ? undefined : ref;
  const { documents, getRelationships } = useListRelationships();
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (id !== undefined) getRelationships([{ relationTo: "media", value: id }]);
  }, [id, getRelationships]);

  const url = pickThumbnailUrl(populated ?? (id === undefined ? undefined : documents?.media?.[id]));
  return (
    <span className="admin-thumb">
      {/* Ảnh admin 40px từ URL media (next/image cần cấu hình domain, vô ích cho thumb webp 400px). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && !broken ? <img src={url} alt="" loading="lazy" width={40} height={40} onError={() => setBroken(true)} /> : null}
    </span>
  );
}
