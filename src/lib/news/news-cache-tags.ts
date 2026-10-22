/**
 * Tag cache của khối "Đọc nhiều" (`loadMostReadNews`). File riêng, không import gì: collection `news` (nạp trong payload.config,
 * cả lúc chạy CLI) đọc hằng này mà không kéo theo `next/cache` hay truy vấn.
 */
export const NEWS_MOST_READ_TAG = "news:most-read";
