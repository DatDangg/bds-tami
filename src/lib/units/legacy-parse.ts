/**
 * Bộ phân tích giá trị chữ cũ của "Tầng" (tin cho thuê) và "Khoảng cách" (tiện ích quanh dự án) sang dạng chuẩn hoá (BL-065).
 * Nguồn sự thật duy nhất cho migration backfill, seed và báo cáo. CHỈ nhận đúng các dạng đã có trong dữ liệu; mọi dạng khác trả `unparsed`
 * (không đoán, vì sai tầng/khoảng cách còn tệ hơn để admin sửa tay).
 * LƯU Ý: migration `20261023_030506_floor_distance_normalized` import parser này (đã chạy trên dev) — KHÔNG đổi hành vi hai hàm dưới; cần parser khác thì tạo hàm mới.
 */

export const FLOOR_LEVELS = ["high", "mid", "low"] as const;
export type FloorLevel = (typeof FLOOR_LEVELS)[number];

export const DISTANCE_UNITS = ["km", "m", "min"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export type LegacyFloor = { kind: "level"; level: FloorLevel } | { kind: "number"; number: number } | { kind: "empty" } | { kind: "unparsed" };
export type LegacyDistance = { kind: "ok"; value: number; unit: DistanceUnit } | { kind: "empty" } | { kind: "unparsed" };

const FLOOR_LEVEL_BY_WORD: Record<string, FloorLevel> = { cao: "high", trung: "mid", "thấp": "low" };
const DISTANCE_UNIT_BY_WORD: Record<string, DistanceUnit> = { km: "km", m: "m", "phút": "min" };

const FLOOR_LEVEL_PATTERN = /^tầng\s+(cao|trung|thấp)$/iu;
const FLOOR_NUMBER_PATTERN = /^tầng\s+(\d+)$/iu;
const DISTANCE_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(km|m|phút)$/iu;

/** Dùng bởi migration `20261023_030506_floor_distance_normalized`: không đổi hành vi, cần khác thì tạo hàm mới. */
export function parseLegacyFloor(text: string | null | undefined): LegacyFloor {
  const trimmed = text?.trim() ?? "";
  if (trimmed === "") return { kind: "empty" };
  const levelWord = FLOOR_LEVEL_PATTERN.exec(trimmed)?.[1];
  if (levelWord) return { kind: "level", level: FLOOR_LEVEL_BY_WORD[levelWord.toLowerCase()]! };
  const digits = FLOOR_NUMBER_PATTERN.exec(trimmed)?.[1];
  if (digits) return { kind: "number", number: Number(digits) };
  return { kind: "unparsed" };
}

/** Dùng bởi migration `20261023_030506_floor_distance_normalized`: không đổi hành vi, cần khác thì tạo hàm mới. */
export function parseLegacyDistance(text: string | null | undefined): LegacyDistance {
  const trimmed = text?.trim() ?? "";
  if (trimmed === "") return { kind: "empty" };
  const match = DISTANCE_PATTERN.exec(trimmed);
  if (!match) return { kind: "unparsed" };
  return { kind: "ok", value: Number(match[1]!.replace(",", ".")), unit: DISTANCE_UNIT_BY_WORD[match[2]!.toLowerCase()]! };
}
