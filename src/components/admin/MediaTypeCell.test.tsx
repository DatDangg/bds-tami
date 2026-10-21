import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it } from "vitest";

import { MediaTypeCell } from "./MediaTypeCell";

const cell = (cellData: unknown) => ({ cellData }) as unknown as DefaultCellComponentProps;

describe("MediaTypeCell", () => {
  it("hiện nhãn dễ đọc", () => {
    render(<MediaTypeCell {...cell("image/png")} />);
    expect(screen.getByText("Ảnh · PNG")).toHaveClass("tami-media-type");
  });

  it("thiếu MIME → gạch ngang", () => {
    render(<MediaTypeCell {...cell(undefined)} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
