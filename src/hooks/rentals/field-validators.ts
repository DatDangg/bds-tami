import type {
  NumberFieldSingleValidation,
  TextFieldSingleValidation,
  UploadFieldManyValidation,
} from "payload";
import { number, upload } from "payload/shared";

import { PUBLIC_STATUSES } from "../../access";

/** Số ảnh tối thiểu để xuất bản tin cho thuê (ERD §4.6). */
export const MIN_PUBLISHED_GALLERY_IMAGES = 3;

type SiblingValues = { status?: unknown; priceNegotiable?: unknown; priceMonthlyVnd?: unknown } | undefined;

/**
 * Giá thuê/tháng: bắt buộc trừ khi `priceNegotiable` (ERD §4.6). Chạy validator `number` mặc định trước (giữ `min: 0`);
 * `siblingData` đã gộp giá trị đã lưu nên lần sửa một phần vẫn thấy `priceNegotiable` hiện tại.
 */
export const validatePriceMonthly: NumberFieldSingleValidation = (value, options) => {
  const base = number(value, options);
  if (base !== true) return base;
  const siblings = options.siblingData as SiblingValues;
  const price = value === undefined ? siblings?.priceMonthlyVnd : value;
  return siblings?.priceNegotiable === true || typeof price === "number" ? true : "Cần nhập giá thuê/tháng hoặc chọn \"Thỏa thuận\".";
};

/** Diện tích bắt buộc và phải lớn hơn 0 (ERD §4.6): `min` của Payload cho phép đúng 0 nên cần kiểm thêm. Chạy validator `number` mặc định (áp `required`) trước. */
export const validateAreaM2: NumberFieldSingleValidation = (value, options) => {
  const base = number(value, options);
  if (base !== true) return base;
  return typeof value === "number" && value <= 0 ? "Diện tích phải lớn hơn 0." : true;
};

const VIDEO_HOSTS = ["youtube.com", "youtu.be", "tiktok.com"];

/**
 * Liên kết video (ERD §4.6: YouTube / TikTok) sẽ được nhúng/hiện thành link trên trang chi tiết, nên chỉ nhận https của các
 * máy chủ này (kể cả tên miền con như www., m., vm.): chặn `javascript:`, http thường và trang lạ.
 */
export const validateVideoUrl: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  try {
    const { protocol, hostname } = new URL(value.trim());
    const allowedHost = VIDEO_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    return protocol === "https:" && allowedHost ? true : "Liên kết video phải là https:// của YouTube hoặc TikTok.";
  } catch {
    return "Liên kết video không hợp lệ.";
  }
};

/**
 * Thư viện ảnh: tối thiểu {@link MIN_PUBLISHED_GALLERY_IMAGES} ảnh khi tin hiển thị công khai (`published` hoặc `rented`; bản nháp được thiếu để sale lưu dở).
 * Chạy validator `upload` mặc định trước: validator tuỳ biến thay hẳn bản mặc định nên nếu không gọi thì `filterOptions` (chỉ ảnh)
 * và kiểm id hợp lệ không còn được áp ở server.
 */
export const validateGallery: UploadFieldManyValidation = async (value, options) => {
  const base = await upload(value, options);
  if (base !== true) return base;
  const siblings = options.siblingData as SiblingValues;
  const current = value === undefined ? options.previousValue : value;
  const count = Array.isArray(current) ? current.length : 0;
  const isPublic = (PUBLIC_STATUSES.rentals as readonly unknown[]).includes(siblings?.status);
  return isPublic && count < MIN_PUBLISHED_GALLERY_IMAGES
    ? `Cần ít nhất ${MIN_PUBLISHED_GALLERY_IMAGES} ảnh trong thư viện ảnh trước khi xuất bản tin cho thuê.`
    : true;
};
