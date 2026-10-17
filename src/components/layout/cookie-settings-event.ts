/**
 * Hợp đồng giữa link "Cài đặt cookie" (footer) và trình quản lý đồng ý cookie (layer-5-task-07, design-spec §3.10):
 * footer phát sự kiện này trên `window`; banner/dialog tuỳ chọn lắng nghe và mở lại. Chưa có người nghe thì bấm không có tác dụng.
 */
export const OPEN_COOKIE_SETTINGS_EVENT = "tami:open-cookie-settings";
