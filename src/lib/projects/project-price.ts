import type { Project } from "../../payload-types";

/** 1 tỷ đồng: đơn vị của `?priceMin=` / `?priceMax=` ở `/du-an` (BL-052). */
export const BILLION_VND = 1_000_000_000;

const positive = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * Giá "Giá từ" của dự án dùng cho thẻ, lọc giá và sắp theo giá (BL-052 Quyết định 6): giá thấp nhất > 0 trong `priceTable[].priceFrom`;
 * bảng giá không có giá nào → `priceFromVnd` nếu > 0 (dữ liệu cũ); không có → `null` ("Liên hệ", bị loại khi lọc giá, xếp cuối khi sắp giá).
 */
export function effectivePriceFromVnd(project: Pick<Project, "priceTable" | "priceFromVnd">): number | null {
  const tablePrices = (project.priceTable ?? []).map((row) => row.priceFrom).filter(positive);
  if (tablePrices.length > 0) return Math.min(...tablePrices);
  return positive(project.priceFromVnd) ? project.priceFromVnd : null;
}
