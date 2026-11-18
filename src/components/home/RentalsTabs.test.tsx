import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { RentalTabView } from "@/lib/home/home-view-listings";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import { RentalsTabs } from "./RentalsTabs";

const card = (id: string): RentalCardData => ({
  id,
  title: `Căn hộ ${id}`,
  href: `/cho-thue/can-ho-${id}`,
  code: `CT-${id}`,
  priceMonthlyVnd: 9_000_000,
  priceNegotiable: false,
  areaM2: 40,
  bedrooms: 1,
  areaLabel: "Phường 1, TP.HCM",
  cover: fakeMedia(id),
  rented: false,
  categoryLabel: "Căn hộ dịch vụ",
  furnishing: "full",
  bathrooms: 1,
});
const tab = (ids: string[]): RentalTabView => ({ id: "nha-o", label: "Thuê nhà ở", href: "/cho-thue/danh-muc/nha-o", cards: ids.map(card) });

describe("RentalsTabs slider (BL-122)", () => {
  it("dùng CardSlider: có mũi tên + chấm (số chấm = số thẻ khi chưa đo layout), mũi tên luôn hiện (không hidden), bước 1 vị trí", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(<RentalsTabs title="Cho thuê" tabs={[tab(["1", "2", "3"])]} />);
    const previous = screen.getByRole("button", { name: "Tin trước" });
    const next = screen.getByRole("button", { name: "Tin sau" });
    expect(previous).not.toHaveClass("hidden");
    expect(next).toHaveClass("size-11");
    const dots = within(screen.getByRole("group", { name: "Chọn tin cho thuê" })).getAllByRole("button");
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute("aria-current", "true");
    expect(dots[0]).toHaveAccessibleName("Chuyển tới tin 1");
    fireEvent.click(next);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("giữ hình học Cho thuê: thẻ 80% < sm · 2 ≥ sm · 4 ≥ lg, vùng cuộn -mx-2 px-2 (không px-gutter)", () => {
    renderWithIntl(<RentalsTabs title="Cho thuê" tabs={[tab(["1", "2"])]} />);
    const slide = screen.getByRole("group", { name: "Tin 1 / 2" });
    expect(slide.className).toContain("w-[80%]");
    expect(slide.className).toContain("sm:w-[calc((100%-1rem)/2)]");
    expect(slide.className).toContain("lg:w-[calc((100%-4.5rem)/4)]");
    const list = screen.getByRole("list", { name: "Cho thuê" });
    expect(list).toHaveClass("-mx-2", "px-2", "lg:gap-6");
    expect(list).not.toHaveClass("px-gutter");
  });

  it("một thẻ: không mũi tên, không chấm", () => {
    renderWithIntl(<RentalsTabs title="Cho thuê" tabs={[tab(["1"])]} />);
    expect(screen.queryByRole("button", { name: "Tin sau" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Chọn tin cho thuê" })).toBeNull();
  });

  it("EN: nhãn chấm tiếng Anh", () => {
    renderWithIntl(<RentalsTabs title="For rent" tabs={[tab(["1", "2"])]} />, "en");
    expect(screen.getByRole("group", { name: "Choose a listing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to listing 2" })).toBeInTheDocument();
  });
});
