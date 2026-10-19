import type { CollectionBeforeOperationHook } from "payload";

/**
 * `localization.fallback` tắt (BR-07) nên Payload KHÔNG thay locale thiếu bằng `defaultLocale`: REST đọc không có `?locale`
 * chạy với `req.locale = null` và mọi trường localized trả `null`. Bộ lọc quan hệ trong admin (`RelationshipFilter`) gọi
 * `GET /api/<collection>/<id>?depth=0` không kèm locale để lấy nhãn → nhãn (`title`/`name`) trống sau khi tải lại trang.
 * Hook chỉ đặt locale mặc định cho thao tác ĐỌC khi request không nêu locale; `?locale=en` / `locale=all` giữ nguyên
 * và `fallback` vẫn tắt (trường thiếu bản EN vẫn trả trống, không rơi về VI).
 */
export const defaultReadLocale: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== "read" || !args || typeof args !== "object" || !("req" in args)) return args;
  const req = (args as { req?: { locale?: string | null; payload?: { config?: { localization?: false | { defaultLocale: string } } } } }).req;
  const localization = req?.payload?.config?.localization;
  if (req && !req.locale && localization) req.locale = localization.defaultLocale;
  return args;
};
