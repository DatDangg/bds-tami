import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading (BL-101)", () => {
  it("căn giữa: h2 có id + gạch trang trí 48x2 ngay sau, eyebrow/mô tả chỉ hiện khi có", () => {
    const { container } = render(<SectionHeading id="h" title="Tiêu đề" />);
    const heading = screen.getByRole("heading", { level: 2, name: "Tiêu đề" });
    expect(heading).toHaveAttribute("id", "h");
    expect(heading.parentElement).toHaveClass("items-center", "text-center", "mb-10");
    expect(heading.nextElementSibling).toHaveClass("h-0.5", "w-12", "bg-primary");
    expect(heading.nextElementSibling).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("eyebrow + mô tả + className ghi đè khoảng cách dưới", () => {
    const { container } = render(<SectionHeading id="h" title="T" eyebrow="Nhỏ" description="Mô tả" className="mb-8" />);
    expect(screen.getByText("Nhỏ")).toHaveClass("text-accent-text");
    expect(screen.getByText("Mô tả")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("mb-8");
    expect(container.firstElementChild).not.toHaveClass("mb-10");
  });
});
