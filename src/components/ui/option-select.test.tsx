import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe("OptionSelect open/onOpenChange opt-in (BL-085)", () => {
  it("controlled: `open` điều khiển listbox, cha đổi `open` là đóng/mở; bấm trigger gọi onOpenChange(true)", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<OptionSelect options={options} open={false} onOpenChange={onOpenChange} aria-label="Mức giá" />);
    const trigger = screen.getByRole("combobox", { name: "Mức giá" });
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("listbox")).toBeNull();
    rerender(<OptionSelect options={options} open onOpenChange={onOpenChange} aria-label="Mức giá" />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    rerender(<OptionSelect options={options} open={false} onOpenChange={onOpenChange} aria-label="Mức giá" />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("không truyền open: uncontrolled như cũ (bấm là mở)", async () => {
    render(<OptionSelect options={options} aria-label="Mức giá" />);
    await userEvent.click(screen.getByRole("combobox", { name: "Mức giá" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
