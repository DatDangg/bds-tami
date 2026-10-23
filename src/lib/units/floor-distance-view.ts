import type { Locale } from "../../i18n/routing";
import type { DistanceUnit, FloorLevel } from "./legacy-parse";

/**
 * Tầng / khoảng cách đã chuẩn hoá (BL-065) thành view theo ngôn ngữ. View chỉ giữ dữ liệu có cấu trúc; chữ hiển thị do component dựng từ
 * i18n (`formatFloor` / `formatDistance`). Giá trị cũ (chuỗi tiếng Việt chưa chuyển được) chỉ hiện ở `/vi`, `/en` không hiện.
 */

export type FloorView = { kind: "number"; number: number } | { kind: "level"; level: FloorLevel } | { kind: "legacy"; text: string };
export type DistanceView = { kind: "measured"; value: number; unit: DistanceUnit } | { kind: "legacy"; text: string };

interface FloorSource {
  floorNumber?: number | null;
  floorLevel?: FloorLevel | null;
  floor?: string | null;
}

interface DistanceSource {
  distanceValue?: number | null;
  distanceUnit?: DistanceUnit | null;
  distance?: string | null;
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const legacyText = (value: string | null | undefined, locale: Locale) => (locale === "vi" && value?.trim() ? value.trim() : null);

/** Số tầng ưu tiên hơn mức tầng; chưa có trường mới thì rơi về giá trị cũ (chỉ `/vi`). */
export function toFloorView(source: FloorSource, locale: Locale): FloorView | null {
  if (isNumber(source.floorNumber)) return { kind: "number", number: source.floorNumber };
  if (source.floorLevel) return { kind: "level", level: source.floorLevel };
  const legacy = legacyText(source.floor, locale);
  return legacy ? { kind: "legacy", text: legacy } : null;
}

/** Thiếu số hoặc đơn vị → không chip; chưa có trường mới thì rơi về giá trị cũ (chỉ `/vi`). */
export function toDistanceView(source: DistanceSource, locale: Locale): DistanceView | null {
  if (isNumber(source.distanceValue) && source.distanceUnit) return { kind: "measured", value: source.distanceValue, unit: source.distanceUnit };
  if (isNumber(source.distanceValue) || source.distanceUnit) return null;
  const legacy = legacyText(source.distance, locale);
  return legacy ? { kind: "legacy", text: legacy } : null;
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function formatFloor(view: FloorView | null, t: Translate): string | null {
  if (!view) return null;
  if (view.kind === "number") return t("floorValue.number", { n: view.number });
  if (view.kind === "level") return t(`floorValue.level.${view.level}`);
  return view.text;
}

export function formatDistance(view: DistanceView | null, t: Translate, locale: Locale): string | null {
  if (!view) return null;
  if (view.kind === "legacy") return view.text;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(view.value)} ${t(`distanceUnit.${view.unit}`)}`;
}
