/**
 * Lớp dùng chung cho phần nội dung (slot) của thẻ nổi bật `SpotlightSlider` ở 3 màn danh sách (BL-061 — cả thẻ bấm được, không lồng `<a>`).
 * Tách khỏi `SpotlightSlider.tsx` ("use client") vì `*SpotlightContent` là server component — chỉ import chuỗi, không import module client.
 */

/**
 * Nút "Xem chi tiết" = link phủ cả thẻ: `::after` trải kín `li` (`relative isolate` ở `SpotlightSlider`); `data-stretched-link` để khung bắt focus-visible + test tra.
 * `active:translate-none` bắt buộc: `buttonVariants` có `active:translate-y-px` — một transform biến chính link thành containing block của `::after`,
 * vùng phủ co về đúng nút trong lúc nhấn chuột nên mouseup rơi vào ảnh / chữ → click không kích hoạt link (đã tái hiện trên Chrome).
 */
export const SPOTLIGHT_STRETCHED_LINK_CLASS = "after:absolute after:inset-0 after:rounded-[20px] after:content-[''] active:translate-none";

/** Link phụ trong slot ("Nhận tư vấn" → `#lead-form`): nổi trên vùng phủ để bấm vào vẫn tới đích riêng, không mở chi tiết. */
export const SPOTLIGHT_SECONDARY_LINK_CLASS = "relative z-10";

/** Tiêu đề đổi màu nhấn khi rê chuột lên bất kỳ chỗ nào của thẻ (`group/spot` trên `li`) — tín hiệu cả thẻ là link. */
export const SPOTLIGHT_TITLE_CLASS = "line-clamp-2 font-display text-h3 transition-colors duration-(--duration-fast) group-hover/spot:text-accent-text motion-reduce:transition-none";
