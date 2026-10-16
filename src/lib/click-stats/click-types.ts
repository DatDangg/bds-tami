/** Loại nút liên hệ nổi được ghi lượt bấm (ERD §4.13, API_SPEC §3.4). */
export const CLICK_TYPES = ["hotline", "zalo", "fanpage"] as const;

export type ClickType = (typeof CLICK_TYPES)[number];
