/** Global đọc ở trang công khai (ARCHITECTURE §5.1). `homepage` thêm ở task riêng. */
export const PUBLIC_GLOBAL_SLUGS = ["site-settings", "header", "footer"] as const;
export type PublicGlobalSlug = (typeof PUBLIC_GLOBAL_SLUGS)[number];

/**
 * Tag cache của một global. MỘT tag cho cả vi và en: khoá `unstable_cache` trong `get-globals` đã có locale,
 * còn tag chung nên lưu global (bất kể ngôn ngữ đang sửa) làm mới cả hai bản và mọi trang dùng nó (header/footer nằm ở layout).
 */
export function globalCacheTag(slug: string): string {
  return `global:${slug}`;
}
