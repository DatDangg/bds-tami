import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { CopyEmailButton } from "./CopyEmailButton";

afterEach(() => vi.unstubAllGlobals());

describe("CopyEmailButton", () => {
  it("bấm → ghi email vào clipboard và hiện 'Đã sao chép'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const { container } = renderWithIntl(<CopyEmailButton email="tuyendung@tami.example" />, "vi");
    fireEvent.click(screen.getByRole("button", { name: "Sao chép email" }));
    await waitFor(() => expect(container.querySelector("[aria-live=polite]")).toHaveTextContent("Đã sao chép"));
    expect(writeText).toHaveBeenCalledWith("tuyendung@tami.example");
  });

  it("clipboard lỗi → báo lỗi kèm email để chép tay", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const { container } = renderWithIntl(<CopyEmailButton email="tuyendung@tami.example" />, "vi");
    fireEvent.click(screen.getByRole("button", { name: "Sao chép email" }));
    await waitFor(() => expect(container.querySelector("[aria-live=polite]")).toHaveTextContent("Không sao chép được, email: tuyendung@tami.example"));
  });

  it("bản EN: nhãn và thông báo bằng tiếng Anh", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const { container } = renderWithIntl(<CopyEmailButton email="hr@tami.example" tone="onDark" />, "en");
    fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
    await waitFor(() => expect(container.querySelector("[aria-live=polite]")).toHaveTextContent("Copied"));
  });

  it("BL-124 onDark: wrapper + nút cùng quy ước với nút chính của CtaBanner (w-full max-w-xs, sm:w-auto)", () => {
    const { container } = renderWithIntl(<CopyEmailButton email="a@b.example" tone="onDark" />, "vi");
    const wrapper = container.firstElementChild as HTMLElement;
    for (const cls of ["w-full", "max-w-xs", "sm:w-auto", "sm:max-w-none"]) expect(wrapper.className).toContain(cls);
    const button = screen.getByRole("button");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("sm:w-auto");
  });

  it("BL-124 light: panel trống không đổi, không ép w-full", () => {
    const { container } = renderWithIntl(<CopyEmailButton email="a@b.example" />, "vi");
    expect((container.firstElementChild as HTMLElement).className).not.toContain("w-full");
    expect(screen.getByRole("button").className).not.toContain("w-full");
  });

  it("focus ring: tone onDark dùng outline-on-dark, tone light dùng focus-ring", () => {
    const dark = renderWithIntl(<CopyEmailButton email="a@b.example" tone="onDark" />, "vi");
    expect(screen.getByRole("button").className).toContain("focus-visible:outline-on-dark");
    dark.unmount();
    renderWithIntl(<CopyEmailButton email="a@b.example" />, "vi");
    expect(screen.getByRole("button").className).toContain("focus-visible:outline-focus-ring");
  });
});
