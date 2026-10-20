import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it } from "vitest";

import { PriceRangeCell, RoomsAreaCell, UnitsSummaryCell } from "./ListSummaryCells";

const cell = (rowData: unknown) => ({ rowData }) as unknown as DefaultCellComponentProps;

describe("ListSummaryCells", () => {
  it("Quy mô đọc scale.totalUnits từ rowData", () => {
    render(<UnitsSummaryCell {...cell({ scale: { totalUnits: 1200 } })} />);
    expect(screen.getByText("1.200 căn")).toBeInTheDocument();
  });
  it("Khoảng giá đọc priceFromVnd/priceToVnd", () => {
    render(<PriceRangeCell {...cell({ priceFromVnd: 2_100_000_000, priceToVnd: 3_500_000_000 })} />);
    expect(screen.getByText("2,1 – 3,5 tỷ")).toBeInTheDocument();
  });
  it("Phòng · diện tích", () => {
    render(<RoomsAreaCell {...cell({ bedrooms: 2, areaM2: 75 })} />);
    expect(screen.getByText("2 PN · 75 m²")).toBeInTheDocument();
  });
  it("rowData thiếu → —", () => {
    render(<RoomsAreaCell {...cell(undefined)} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
