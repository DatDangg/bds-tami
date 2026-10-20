import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("canh trái: eyebrow → h2 (phần nhấn text-accent-text) → mô tả", () => {
    const { container } = render(<SectionHeading eyebrow="Tin tức" title="Cập nhật" titleAccent="thị trường" description="Mô tả" />);
    expect(container.firstElementChild).toHaveClass("text-left", "items-start");
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Cập nhật thị trường");
    expect(heading.querySelector("span")).toHaveClass("text-accent-text");
    expect(screen.getByText("Tin tức")).toHaveClass("text-accent-text");
    expect(screen.getByText("Mô tả")).toBeInTheDocument();
  });

  it("as=h3 đổi cấp heading", () => {
    render(<SectionHeading as="h3" title="Mục" />);
    expect(screen.getByRole("heading", { level: 3, name: "Mục" })).toBeInTheDocument();
  });
});
