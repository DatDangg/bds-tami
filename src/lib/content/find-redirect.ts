import type { Payload } from "payload";

import { isSafeInternalPath } from "./internal-path";
import { isRedirectSourcePath, normalizeRedirectSource } from "./redirect-paths";

/**
 * Đích chuyển hướng 301 (đường dẫn công khai) của một URL, hoặc `null` nếu không có. Chỉ tra với URL dạng trang chi tiết
 * (`isRedirectSourcePath`) để các request khác không tốn truy vấn. Đọc bằng `overrideAccess` vì `redirects` chỉ admin đọc qua API.
 */
export async function findRedirectTarget(payload: Payload, pathname: string): Promise<string | null> {
  if (!isRedirectSourcePath(pathname)) return null;
  const { docs } = await payload.find({
    collection: "redirects",
    where: { from: { equals: normalizeRedirectSource(pathname) } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const to = docs[0]?.to;
  // Đích không an toàn (dữ liệu bẩn ghi thẳng DB) bị bỏ qua: `redirects` không được dẫn khách ra ngoài website.
  return isSafeInternalPath(to) ? to : null;
}
