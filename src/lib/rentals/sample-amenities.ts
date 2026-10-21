import { RENTAL_AMENITIES, type RentalAmenity } from "../../shared/types/api";

/**
 * Logic thuần của `pnpm seed:rental-amenities` (BL-044, chỉ DB dev): chọn 2–5 tiện ích "ngẫu nhiên nhưng ổn định" theo id tin,
 * để chạy lại cho cùng tin vẫn ra cùng bộ (idempotent + so khớp được giữa T01/T03). Tách khỏi script để test không cần Payload.
 */

const MIN_AMENITIES = 2;
const MAX_AMENITIES = 5;

/** djb2 trên chuỗi: đủ phân tán cho uuid, không cần crypto. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  return hash;
}

/** Bộ tiện ích mẫu của một tin: số lượng 2–5 và vị trí bắt đầu lấy từ hash id, rồi lấy liên tiếp vòng tròn theo `RENTAL_AMENITIES`. */
export function sampleAmenitiesFor(rentalId: string): RentalAmenity[] {
  const hash = hashString(rentalId);
  const count = MIN_AMENITIES + (hash % (MAX_AMENITIES - MIN_AMENITIES + 1));
  const start = Math.floor(hash / 7) % RENTAL_AMENITIES.length;
  const step = 1 + (Math.floor(hash / 131) % 3);
  const picked: RentalAmenity[] = [];
  for (let i = 0; picked.length < count; i++) {
    const amenity = RENTAL_AMENITIES[(start + i * step) % RENTAL_AMENITIES.length]!;
    if (!picked.includes(amenity)) picked.push(amenity);
  }
  // Giữ thứ tự danh sách gốc để giống dữ liệu admin nhập.
  return RENTAL_AMENITIES.filter((amenity) => picked.includes(amenity));
}

/** Kết quả kiểm môi trường của seed: chỉ cho chạy trên DB dev, hoặc staging khi bật `ALLOW_STAGING_SEED=1`; không bao giờ trên prod. */
export type SeedEnvCheck = { allowed: true } | { allowed: false; reason: string };

/**
 * Từ chối khi `NODE_ENV=production` hoặc `DATABASE_URL` trùng chuỗi của staging/prod (tên env theo `.context/project-config.md`:
 * `DATABASE_URL_STAGING` / `DATABASE_URL_PROD`). So khớp chuỗi đủ cho mục đích chặn nhầm; không parse URL để khỏi lộ secret ra log.
 */
export function checkSeedEnvironment(env: Record<string, string | undefined>): SeedEnvCheck {
  if (env.APP_ENV === "production") return { allowed: false, reason: "APP_ENV=production" };
  const current = env.DATABASE_URL?.trim();
  if (!current) return { allowed: false, reason: "thiếu DATABASE_URL" };
  const prod = env.DATABASE_URL_PROD?.trim();
  if (prod && prod === current) return { allowed: false, reason: "DATABASE_URL trùng DATABASE_URL_PROD" };
  // Staging là dữ liệu mẫu (ARCHITECTURE §8): cho seed khi bật rõ cờ trong container staging (image luôn NODE_ENV=production).
  if (env.APP_ENV === "staging" && env.ALLOW_STAGING_SEED === "1") return { allowed: true };
  if (env.NODE_ENV === "production") return { allowed: false, reason: "NODE_ENV=production" };
  for (const name of ["DATABASE_URL_STAGING", "DATABASE_URL_PROD"] as const) {
    const guarded = env[name]?.trim();
    if (guarded && guarded === current) return { allowed: false, reason: `DATABASE_URL trùng ${name}` };
  }
  return { allowed: true };
}
