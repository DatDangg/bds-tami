import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DetailTitleCard } from "./DetailTitleCard";

const facts = [
  { icon: <svg data-testid="i1" />, label: "Quy mô", value: "45 ha" },
  { icon: <svg data-testid="i2" />, label: "Bàn giao", value: "Quý IV/2027" },
];

describe("DetailTitleCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("thẻ trắng nổi: eyebrow + badge, một h1, vị trí, giá + nhãn, dải thông số trong thẻ (giá trị đậm, nhãn muted)", () => {
    const { container } = renderWithIntl(
      <DetailTitleCard eyebrow="Khu đô thị" badge={<span>Đang mở bán</span>} title="The Crown" location="TP Bắc Ninh" priceLabel="Giá từ" price="3,2 tỷ" facts={facts} factsLabel="Thông số" shareTitle="The Crown" />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "The Crown" })).toBeInTheDocument();
    expect(screen.getByText("Khu đô thị")).toBeInTheDocument();
    expect(screen.getByText("Đang mở bán")).toBeInTheDocument();
    expect(screen.getByText("TP Bắc Ninh")).toBeInTheDocument();
    expect(screen.getByText("Giá từ")).toBeInTheDocument();
    const price = screen.getByText("3,2 tỷ");
    expect(price.className).toContain("text-accent-text");
    const list = screen.getByRole("list", { name: "Thông số" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const value = within(list).getByText("45 ha");
    expect(value.className).toContain("text-text");
    expect(within(list).getByText("Quy mô").className).toContain("text-text-muted");
    expect(list.querySelector("span.bg-primary-subtle")).not.toBeNull();
    // Dải thông số nằm TRONG thẻ trắng (cùng khối với h1), ngăn bằng đường kẻ.
    // BL-046: 32px trước thanh mục con (thẻ là khối liền trước thanh).
    expect((container.querySelector("div.bg-surface") as HTMLElement).parentElement).toHaveClass("pb-8");
    const card = container.querySelector("div.bg-surface") as HTMLElement;
    expect(card.contains(list)).toBe(true);
    expect(card.contains(screen.getByRole("heading", { level: 1 }))).toBe(true);
    expect(list.className).toContain("border-t");
    // Không có nút tim (DECISIONS #2).
    expect(screen.queryByRole("button", { name: /yêu thích|lưu/i })).toBeNull();
  });

  it("không facts → không dải; không price → không cột giá; không location/eyebrow thì ẩn", () => {
    renderWithIntl(<DetailTitleCard title="Tin" shareTitle="Tin" />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText("Giá từ")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Tin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
  });

  it("chia sẻ: có Web Share thì gọi navigator.share với URL canonical", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    renderWithIntl(<DetailTitleCard title="The Crown" shareTitle="The Crown" shareUrl="https://tami.example/du-an/the-crown" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Chia sẻ" }));
    expect(share).toHaveBeenCalledWith({ title: "The Crown", url: "https://tami.example/du-an/the-crown" });
  });

  it("chia sẻ: không có Web Share → mở menu Facebook / Zalo / sao chép, Esc đóng và trả focus", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailTitleCard title="The Crown" shareTitle="The Crown" shareUrl="https://tami.example/du-an/the-crown" />);
    const button = screen.getByRole("button", { name: "Chia sẻ" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("group", { name: "Chia sẻ trang này" });
    expect(within(menu).getByRole("link", { name: /Facebook/ })).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("https://tami.example/du-an/the-crown")));
    expect(within(menu).getByRole("button", { name: /Sao chép/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
