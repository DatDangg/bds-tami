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
  rented: false,
  categoryLabel: "Căn hộ dịch vụ",
  furnishing: "full",
  bathrooms: 1,
};

describe("RentalCard biến thể home (trang chủ giữ thẻ BL-045)", () => {
  it("cả thẻ là MỘT link; tên là h3 mặc định, h2 khi headingLevel=2", () => {
    const { unmount } = renderWithIntl(<RentalCard variant="home" data={data} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 3, name: "Studio Ba Đình" })).toBeInTheDocument();
    unmount();
    renderWithIntl(<RentalCard variant="home" data={data} headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Studio Ba Đình" })).toBeInTheDocument();
  });

  it("hover tiêu đề: đổi sang màu thương hiệu, không gạch chân", () => {
    renderWithIntl(<RentalCard variant="home" data={data} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("group-hover:text-accent-text", "group-focus-visible:text-accent-text");
    expect(heading).not.toHaveClass("group-hover:underline");
  });

  it("vi: giá rút gọn + /tháng, diện tích, PN, khu vực; en: BR và đơn vị tiếng Anh", () => {
    const { unmount } = renderWithIntl(<RentalCard variant="home" data={data} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cho-thue/studio-ba-dinh");
    expect(link).toHaveTextContent("Phường Ba Đình, Hà Nội");
    expect(link).toHaveTextContent("8,5 triệu/tháng");
    expect(link).toHaveTextContent("Còn trống");
    expect(link).toHaveTextContent("32,5 m²");
    expect(link).toHaveTextContent("1 PN");
    unmount();
    renderWithIntl(<RentalCard variant="home" data={data} />, "en");
    expect(screen.getByRole("link")).toHaveTextContent("8.5 million VND/month");
    expect(screen.getByRole("link")).toHaveTextContent("32.5 m²");
    expect(screen.getByRole("link")).toHaveTextContent("1 BR");
    expect(screen.getByRole("link")).toHaveTextContent("Available");
  });

  it("không giá -> Thoả thuận; không phòng ngủ -> chỉ diện tích; không ảnh -> icon thay thế, không <img>", () => {
    renderWithIntl(<RentalCard variant="home" data={{ ...data, priceMonthlyVnd: null, bedrooms: null, cover: null }} />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Thoả thuận");
    expect(link).not.toHaveTextContent("PN");
    expect(link.querySelector("img")).toBeNull();
  });

  it("khung thẻ như ProjectCard: ảnh 11:10, giá vàng, mũi tên tròn, KHÔNG icon tim", () => {
    const { container } = renderWithIntl(<RentalCard variant="home" data={data} />);
    expect(container.querySelector('[class*="aspect-[11/10]"]')).not.toBeNull();
    expect(screen.getByText(/8,5 triệu/)).toHaveClass("text-accent-text");
    expect(screen.getByRole("heading", { level: 3 }).className).toContain("min-h-[2lh]");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("[data-testid*=heart i], [class*=heart i]")).toBeNull();
  });

  it("ảnh bìa trang trí (alt rỗng): tên tin đã là nhãn của link", () => {
    renderWithIntl(<RentalCard variant="home" data={data} />);
    expect(screen.getByRole("link").querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("RentalCard biến thể listing (mặc định, BL-052)", () => {
  it("data-card-variant=listing; cả thẻ là MỘT link; tag danh mục + nội thất; giá/tháng; diện tích · PN · PT; mũi tên; không tim", () => {
    const { container } = renderWithIntl(<RentalCard data={data} headingLevel={2} />);
    expect(container.querySelector("article")).toHaveAttribute("data-card-variant", "listing");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Studio Ba Đình" })).toBeInTheDocument();
    const tags = screen.getByRole("list", { name: "Phân loại" });
    expect([...tags.querySelectorAll("li")].map((item) => item.textContent)).toEqual(["Căn hộ dịch vụ", "Nội thất đầy đủ"]);
    expect(screen.getByText(/8,5 triệu/)).toHaveClass("text-accent-text");
    const specs = screen.getByRole("list", { name: "Thông số" });
    expect(specs).toHaveTextContent("32,5 m²");
    expect(specs).toHaveTextContent("1 PN");
    expect(specs).toHaveTextContent("1 PT");
    expect(screen.getByText("1 phòng tắm")).toHaveClass("sr-only");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("[data-testid*=heart i], [class*=heart i]")).toBeNull();
  });

  it("tin còn trống: KHÔNG badge \"Còn trống\"; tin đã thuê: badge \"Đã thuê\"", () => {
    const { unmount } = renderWithIntl(<RentalCard data={data} />);
    expect(screen.getByRole("link")).not.toHaveTextContent("Còn trống");
    expect(screen.getByRole("link")).not.toHaveTextContent("Đã thuê");
    unmount();
    renderWithIntl(<RentalCard data={{ ...data, rented: true }} />);
    expect(screen.getByText("Đã thuê")).toHaveAttribute("data-variant", "dark");
  });

  it("thiếu danh mục / nội thất / phòng: không có list tag, chỉ diện tích; không giá → Thoả thuận", () => {
    renderWithIntl(<RentalCard data={{ ...data, categoryLabel: null, furnishing: null, bedrooms: null, bathrooms: null, priceMonthlyVnd: null }} />);
    expect(screen.queryByRole("list", { name: "Phân loại" })).toBeNull();
    const specs = screen.getByRole("list", { name: "Thông số" });
    expect(specs.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveTextContent("Thoả thuận");
  });

  it("en: nhãn tiếng Anh (BR / BA, nội thất, /month)", () => {
    renderWithIntl(<RentalCard data={{ ...data, rented: true, bedrooms: 2 }} />, "en");
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Rented");
    expect(link).toHaveTextContent("Fully furnished");
    expect(link).toHaveTextContent("2 BR");
    expect(link).toHaveTextContent("1 BA");
    expect(link).toHaveTextContent("8.5 million VND/month");
    expect(screen.getByText("2 bedrooms")).toHaveClass("sr-only");
  });
});
