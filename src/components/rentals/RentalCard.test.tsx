import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { RentalCardData } from "@/lib/rentals/rental-view";
import { RentalCard } from "./RentalCard";

const data: RentalCardData = {
  id: "1",
  title: "Studio Ba Đình",
  href: "/cho-thue/studio-ba-dinh",
  code: "CT-000001",
  priceMonthlyVnd: 8_500_000,
  areaM2: 32.5,
  bedrooms: 1,
  areaLabel: "Phường Ba Đình, Hà Nội",
  cover: fakeMedia("studio"),
};

describe("RentalCard (dùng chung danh sách S04 + tin tương tự S07)", () => {
  it("cả thẻ là MỘT link; tên là h3 mặc định, h2 khi headingLevel=2", () => {
    const { unmount } = renderWithIntl(<RentalCard data={data} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 3, name: "Studio Ba Đình" })).toBeInTheDocument();
    unmount();
    renderWithIntl(<RentalCard data={data} headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Studio Ba Đình" })).toBeInTheDocument();
  });

  it("vi: giá rút gọn + /tháng, diện tích, PN, khu vực; en: BR và đơn vị tiếng Anh", () => {
    const { unmount } = renderWithIntl(<RentalCard data={data} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cho-thue/studio-ba-dinh");
    expect(link).toHaveTextContent("Phường Ba Đình, Hà Nội");
    expect(link).toHaveTextContent("8,5 triệu/tháng");
    expect(link).toHaveTextContent("32,5 m² · 1 PN");
    unmount();
    renderWithIntl(<RentalCard data={data} />, "en");
    expect(screen.getByRole("link")).toHaveTextContent("8.5 million VND/month");
    expect(screen.getByRole("link")).toHaveTextContent("32.5 m² · 1 BR");
  });

  it("không giá -> Thoả thuận; không phòng ngủ -> chỉ diện tích; không ảnh -> icon thay thế, không <img>", () => {
    renderWithIntl(<RentalCard data={{ ...data, priceMonthlyVnd: null, bedrooms: null, cover: null }} />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Thoả thuận");
    expect(link).not.toHaveTextContent("PN");
    expect(link.querySelector("img")).toBeNull();
  });

  it("ảnh bìa trang trí (alt rỗng): tên tin đã là nhãn của link", () => {
    renderWithIntl(<RentalCard data={data} />);
    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute("alt", "");
  });
});
