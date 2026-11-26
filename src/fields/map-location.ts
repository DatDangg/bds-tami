import type { PointField, PointFieldValidation } from "payload";
import { point } from "payload/shared";

/**
 * Vùng cho phép của "Toạ độ bản đồ" (BL-131). Là hộp chữ nhật có lề quanh lãnh thổ Việt Nam: đất liền chỉ 8.4–23.4°N, 102.1–109.5°E,
 * nhưng lề rộng ra để gồm cả Hoàng Sa (~16.5°N, 112°E), Trường Sa (~8.6°N, 111.9°E) và đảo xa (Thổ Chu, Côn Đảo, Phú Quốc), tránh
 * chặn nhầm toạ độ hợp lệ. Mục đích là bắt lỗi nhập sai rõ ràng (ngược kinh/vĩ độ, dán toạ độ nước ngoài), không phải kiểm ranh giới chính xác.
 */
export const VIETNAM_LAT_RANGE = { min: 7, max: 24 } as const;
export const VIETNAM_LNG_RANGE = { min: 101.5, max: 118 } as const;

const MESSAGE_SWAPPED = "Có vẻ bạn nhập ngược kinh độ và vĩ độ.";
const MESSAGE_OUTSIDE_VIETNAM = "Toạ độ không nằm ở Việt Nam, kiểm tra lại.";

function inRange(value: number, range: { min: number; max: number }): boolean {
  return value >= range.min && value <= range.max;
}

/** Ô trống của form có thể là `null`, `undefined`, `[]`, `["", ""]` hoặc chuỗi rỗng. */
function isBlankPart(part: unknown): boolean {
  return part === null || part === undefined || part === "";
}

/**
 * Validate server cho ô point (Payload lưu `[lng, lat]`): chạy validator `point` mặc định trước (số hợp lệ, `required`, biên ±180/±90),
 * rồi kiểm vùng Việt Nam. Trống thì hợp lệ (ô tuỳ chọn; `required` do validator mặc định xử lý). Toạ độ chỉ nhập một nửa để cho validator
 * mặc định phán, nên ở đây chỉ kiểm khi đủ hai số.
 */
export const validateMapLocation: PointFieldValidation = (value, options) => {
  const coordinates = readCoordinates(value);
  // Ngược kinh/vĩ độ phải kiểm TRƯỚC validator mặc định: [10.77, 106.70] có "vĩ độ" 106 vượt ±90 nên mặc định sẽ báo "vĩ độ ngoài biên"
  // thay vì câu gợi ý đúng nguyên nhân.
  if (coordinates && isSwapped(coordinates)) return MESSAGE_SWAPPED;
  const base = point(value, options);
  if (base !== true) return base;
  if (coordinates && !isInVietnam(coordinates)) return MESSAGE_OUTSIDE_VIETNAM;
  return true;
};

type Coordinates = { lng: number; lat: number };

/** `[lng, lat]` đủ hai số, hoặc null (trống / thiếu một nửa / không phải số: để validator mặc định phán). */
function readCoordinates(value: unknown): Coordinates | null {
  if (!Array.isArray(value) || isBlankPart(value[0]) || isBlankPart(value[1])) return null;
  const lng = Number.parseFloat(String(value[0]));
  const lat = Number.parseFloat(String(value[1]));
  return Number.isNaN(lng) || Number.isNaN(lat) ? null : { lng, lat };
}

function isInVietnam({ lng, lat }: Coordinates): boolean {
  return inRange(lat, VIETNAM_LAT_RANGE) && inRange(lng, VIETNAM_LNG_RANGE);
}

/** Đảo: kinh độ nằm trong dải vĩ độ VN và vĩ độ nằm trong dải kinh độ VN (vd [10.77, 106.70]). */
function isSwapped({ lng, lat }: Coordinates): boolean {
  return inRange(lng, VIETNAM_LAT_RANGE) && inRange(lat, VIETNAM_LNG_RANGE);
}

type MapLocationOverrides = { name?: string; access?: PointField["access"]; description?: string };

/** Ô "Toạ độ bản đồ" dùng chung cho Cho thuê, Dự án, tiện ích dự án, Tin BĐS, Cài đặt chung, văn phòng. Giữ `name`/`access`/mô tả từng chỗ. */
export function mapLocationField({ name = "location", access, description }: MapLocationOverrides = {}): PointField {
  return {
    name,
    type: "point",
    label: "Toạ độ bản đồ",
    validate: validateMapLocation,
    ...(access ? { access } : {}),
    ...(description ? { admin: { description } } : {}),
  };
}
