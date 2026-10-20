import { formatArea, formatNumber } from "../format";

const EMPTY = "—";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
/** Giá 0 coi như chưa nhập giá (khớp "giá thương lượng"/để trống). */
const isPrice = (value: unknown): value is number => isNumber(value) && value > 0;

/** Số căn của dự án: `1.200 căn`; thiếu → `—`. */
export function formatUnitsSummary(totalUnits: unknown): string {
  return isNumber(totalUnits) ? `${formatNumber(totalUnits, "vi")} căn` : EMPTY;
}

/** Tách giá thành số + đơn vị rút gọn (tỷ/triệu); dưới 1 triệu giữ số đầy đủ kèm `₫`. */
function compactParts(amount: number): { number: string; unit: string } {
  // Chọn đơn vị sau khi làm tròn 2 chữ số lẻ: 999.999.999 → "1 tỷ", không phải "1.000 triệu".
  if (Math.round((amount / 1_000_000_000) * 100) >= 100) return { number: formatNumber(amount / 1_000_000_000, "vi"), unit: "tỷ" };
  if (amount >= 1_000_000) return { number: formatNumber(amount / 1_000_000, "vi"), unit: "triệu" };
  return { number: formatNumber(amount, "vi"), unit: "₫" };
}

const withUnit = (parts: { number: string; unit: string }) => `${parts.number} ${parts.unit}`;

/** Khoảng giá dự án: `2,1 – 3,5 tỷ` · `850 triệu – 1,2 tỷ` · `Từ 2,1 tỷ` · `Đến 3,5 tỷ`; bằng nhau → một giá; thiếu cả hai → `—`. */
export function formatPriceRange(from: unknown, to: unknown): string {
  const low = isPrice(from) ? compactParts(from) : undefined;
  const high = isPrice(to) ? compactParts(to) : undefined;
  if (!low && !high) return EMPTY;
  if (low && !high) return `Từ ${withUnit(low)}`;
  if (!low && high) return `Đến ${withUnit(high)}`;
  if (!low || !high) return EMPTY;
  if (withUnit(low) === withUnit(high)) return withUnit(low);
  return low.unit === high.unit ? `${low.number} – ${withUnit(high)}` : `${withUnit(low)} – ${withUnit(high)}`;
}

/** Phòng + diện tích tin cho thuê: `2 PN · 75 m²` · `Studio · 30 m²` (0 PN) · `75 m²` (thiếu PN) · thiếu cả hai → `—`. */
export function formatRoomsArea(bedrooms: unknown, areaM2: unknown): string {
  const rooms = isNumber(bedrooms) ? (bedrooms === 0 ? "Studio" : `${formatNumber(bedrooms, "vi")} PN`) : undefined;
  const area = isNumber(areaM2) ? formatArea(areaM2, "vi") : undefined;
  return [rooms, area].filter(Boolean).join(" · ") || EMPTY;
}
