"use client";

import type { DefaultCellComponentProps } from "payload";

import { formatPriceRange, formatRoomsArea, formatUnitsSummary } from "../../lib/admin/list-summary";

/** Cột ghép của danh sách: trường `ui` không có dữ liệu riêng nên đọc từ `rowData` (list view không dùng select theo cột → đủ trường). */
type Row = { scale?: { totalUnits?: unknown } | null; priceFromVnd?: unknown; priceToVnd?: unknown; bedrooms?: unknown; areaM2?: unknown };
const rowOf = (props: DefaultCellComponentProps): Row => (props.rowData ?? {}) as Row;

export function UnitsSummaryCell(props: DefaultCellComponentProps) {
  return <span>{formatUnitsSummary(rowOf(props).scale?.totalUnits)}</span>;
}

export function PriceRangeCell(props: DefaultCellComponentProps) {
  const row = rowOf(props);
  return <span>{formatPriceRange(row.priceFromVnd, row.priceToVnd)}</span>;
}

export function RoomsAreaCell(props: DefaultCellComponentProps) {
  const row = rowOf(props);
  return <span>{formatRoomsArea(row.bedrooms, row.areaM2)}</span>;
}
