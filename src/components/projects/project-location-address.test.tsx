import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { ProjectLocation } from "./ProjectLocation";

const ASTOR = "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội";

describe("ProjectLocation — địa chỉ không lặp phường/tỉnh (BL-081)", () => {
  it("address đã gồm phường + tỉnh: hiện đúng một lần", () => {
    renderWithIntl(<ProjectLocation projectName="Astor" location={null} address={ASTOR} areaLabel="Phường Phú Thượng, Hà Nội" />);
    expect(screen.getByText(ASTOR)).toBeInTheDocument();
  });

  it("address thiếu tỉnh: thêm phần còn thiếu", () => {
    renderWithIntl(<ProjectLocation projectName="Astor" location={null} address="Lô IA25, phường Phú Thượng" areaLabel="Phường Phú Thượng, Hà Nội" />);
    expect(screen.getByText("Lô IA25, phường Phú Thượng, Hà Nội")).toBeInTheDocument();
  });
});
