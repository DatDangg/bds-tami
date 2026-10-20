import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OptionSelect } from "./option-select";

const options = [
  { value: "", label: "Tất cả" },
  { value: "a", label: "A" },
];

describe("OptionSelect variant chip (BL-044)", () => {
  it("chip: viên thuốc viền `border`, cao 40px (< md 44px); đang chọn nền primary-soft; mặc định vẫn là ô 48px", () => {
    const { unmount } = render(<OptionSelect variant="chip" options={options} value="" aria-label="Mức giá" />);
    const trigger = screen.getByRole("combobox", { name: "Mức giá" });
    expect(trigger.className).toMatch(/\bh-11\b.*\bmd:h-10\b|\bmd:h-10\b.*\bh-11\b/);
    expect(trigger.className).toContain("rounded-pill");
    expect(trigger.className).not.toContain("bg-primary-soft");
    unmount();
    render(<OptionSelect variant="chip" options={options} value="a" aria-label="Mức giá" />);
    expect(screen.getByRole("combobox", { name: "Mức giá" }).className).toContain("bg-primary-soft");
  });

  it("mặc định: không có lớp chip", () => {
    render(<OptionSelect options={options} value="a" aria-label="Mức giá" />);
    expect(screen.getByRole("combobox", { name: "Mức giá" }).className).not.toContain("rounded-pill");
  });
});
