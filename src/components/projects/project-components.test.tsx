import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { ProjectCard } from "./ProjectCard";
import { ProjectSpotlightContent } from "./ProjectSpotlightContent";

const card = (overrides: Partial<ProjectCardData> = {}): ProjectCardData => ({
  id: "d1",
  title: "Dự án Sông Sài Gòn",
  href: "/du-an/song-sai-gon",
  salesStatus: "selling",
  provinceName: "TP. Hồ Chí Minh",
  categoryName: "Căn hộ",
  cover: fakeMedia("anh-1"),
  productTypes: [],
  priceFromLabel: null,
  areaRangeLabel: null,
  handoverTime: null,
  summary: null,
  address: null,
  ...overrides,
});

describe("ProjectCard", () => {
  it("cả thẻ là MỘT link phủ ảnh + chữ (không lồng link); tiêu đề h2 tối đa 2 dòng; badge, tỉnh, mũi tên tròn; không icon tim", () => {
    const { container } = renderWithIntl(<ProjectCard data={card()} />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/du-an/song-sai-gon");
    const heading = within(link).getByRole("heading", { level: 2, name: "Dự án Sông Sài Gòn" });
    expect(heading.className).toContain("line-clamp-2");
    expect(link).toHaveTextContent("Đang mở bán");
    expect(link).toHaveTextContent("TP. Hồ Chí Minh");
    expect(link.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("[data-testid*=heart i], [class*=heart i]")).toBeNull();
    expect(heading.className).toContain("min-h-[2lh]");
    expect(link.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("badge theo trạng thái: Sắp mở bán / Đã bàn giao (neutral); EN không còn chữ Việt trong nhãn", () => {
    const { unmount } = renderWithIntl(<ProjectCard data={card({ salesStatus: "upcoming" })} />);
    expect(screen.getByText("Sắp mở bán")).toHaveAttribute("data-variant", "primary");
    unmount();
    renderWithIntl(<ProjectCard data={card({ salesStatus: "handed_over" })} />);
    expect(screen.getByText("Đã bàn giao")).toHaveAttribute("data-variant", "neutral");
  });

  it("EN: nhãn tiếng Anh", () => {
    renderWithIntl(<ProjectCard data={card()} />, "en");
    expect(screen.getByText("Now selling")).toBeInTheDocument();
  });

  it("thiếu ảnh / tỉnh: vẫn giữ khung ảnh, không render phần thiếu", () => {
    const { container } = renderWithIntl(<ProjectCard data={card({ cover: null, provinceName: null })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[class~=\"aspect-[11/10]\"]")).not.toBeNull();
    expect(screen.queryByText("TP. Hồ Chí Minh")).toBeNull();
  });

  it("thẻ đầu (priority) tải ảnh ngay, thẻ khác lazy", () => {
    const first = renderWithIntl(<ProjectCard data={card()} priority />);
    expect(first.container.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    first.unmount();
    const second = renderWithIntl(<ProjectCard data={card()} />);
    expect(second.container.querySelector("img")).toHaveAttribute("loading", "lazy");
  });
});

describe("ProjectCard biến thể (BL-052)", () => {
  it("listing (mặc định): ≤ 3 tag loại sản phẩm + '+n', 'Giá từ' vàng; vẫn MỘT link, không tim", () => {
    const { container } = renderWithIntl(
      <ProjectCard data={card({ productTypes: ["apartment", "townhouse", "villa", "shophouse", "land"], priceFromLabel: "5,4 tỷ" })} />,
    );
    const article = container.querySelector("article");
    expect(article).toHaveAttribute("data-card-variant", "listing");
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const tags = screen.getByRole("list", { name: "Loại sản phẩm" });
    expect(within(tags).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Căn hộ", "Nhà phố/Liền kề", "Biệt thự", "+2và 2 loại khác"]);
    expect(screen.getByText("Giá từ")).toBeInTheDocument();
    expect(screen.getByText("5,4 tỷ").className).toContain("text-accent-text");
    expect(container.querySelector("[data-testid*=heart i], [class*=heart i]")).toBeNull();
  });

  it("listing: không có giá → 'Liên hệ'; không có loại → không có danh sách tag; EN nhãn tiếng Anh", () => {
    const { unmount } = renderWithIntl(<ProjectCard data={card()} />);
    expect(screen.getByText("Liên hệ")).toBeInTheDocument();
    expect(screen.queryByText("Giá từ")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    unmount();
    renderWithIntl(<ProjectCard data={card({ productTypes: ["office"], priceFromLabel: "3.5 billion VND" })} />, "en");
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("Price from")).toBeInTheDocument();
  });

  it("home (trang chủ): giữ thẻ BL-045 — không tag, không giá, không 'Liên hệ'; ghim tỉnh + mũi tên", () => {
    const { container } = renderWithIntl(
      <ProjectCard variant="home" data={{ id: "d1", title: "Dự án A", href: "/du-an/a", provinceName: "Hà Nội", cover: null, salesStatus: "selling" }} headingLevel="h3" />,
    );
    expect(container.querySelector("article")).toHaveAttribute("data-card-variant", "home");
    expect(screen.getByRole("heading", { level: 3, name: "Dự án A" })).toBeInTheDocument();
    expect(screen.getByText("Hà Nội")).toBeInTheDocument();
    expect(screen.queryByText("Liên hệ")).toBeNull();
    expect(screen.queryByText("Giá từ")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(container.querySelector("a [aria-hidden=true].rounded-full")).not.toBeNull();
  });
});

describe("ProjectSpotlightContent (BL-052)", () => {
  it("badge danh mục + tình trạng, tên, địa chỉ, tóm tắt, Giá từ · Diện tích · Bàn giao, nút Xem chi tiết + Nhận tư vấn (#lead-form)", () => {
    renderWithIntl(
      <ProjectSpotlightContent
        data={card({ address: "12 Lê Lợi", summary: "Mô tả ngắn", priceFromLabel: "5,4 tỷ", areaRangeLabel: "50–120 m²", handoverTime: "Quý IV/2027" })}
      />,
    );
    expect(screen.getByText("Căn hộ")).toBeInTheDocument();
    expect(screen.getByText("Đang mở bán")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    expect(screen.getByText("12 Lê Lợi")).toBeInTheDocument();
    expect(screen.getByText("Mô tả ngắn")).toBeInTheDocument();
    const facts = screen.getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(facts).toEqual([
      ["Giá từ", "5,4 tỷ"],
      ["Diện tích", "50–120 m²"],
      ["Bàn giao", "Quý IV/2027"],
    ]);
    expect(screen.getByRole("link", { name: /Xem chi tiết/ })).toHaveAttribute("href", "/du-an/song-sai-gon");
    expect(screen.getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/du-an/song-sai-gon#lead-form");
    // BL-056: nút phụ là outline (viền + chữ màu text), không phải viền xám nhạt của `secondary`.
    expect(screen.getByRole("link", { name: /Nhận tư vấn/ })).toHaveClass("border-text", "text-text");
    // `buttonVariants` dùng thẳng (không qua `Button`) mà không gộp class thì `border-transparent` của lớp nền thắng `border-text` → viền vô hình (nguyên nhân gốc A5).
    expect(screen.getByRole("link", { name: /Nhận tư vấn/ })).not.toHaveClass("border-transparent");
  });

  it("BL-061: 'Xem chi tiết' là link phủ cả thẻ (after:inset-0, data-stretched-link); 'Nhận tư vấn' nổi trên (relative z-10) giữ #lead-form; tiêu đề đổi màu khi hover thẻ", () => {
    renderWithIntl(<ProjectSpotlightContent data={card()} />);
    const detail = screen.getByRole("link", { name: "Xem chi tiết: Dự án Sông Sài Gòn" });
    expect(detail).toHaveAttribute("data-stretched-link");
    expect(detail).toHaveClass("after:absolute", "after:inset-0");
    // Nút có `active:translate-y-px` thì transform lúc nhấn biến link thành containing block của `::after` → vùng phủ co lại, mouseup rơi ra ngoài, click không điều hướng.
    expect(detail).toHaveClass("active:translate-none");
    expect(detail).not.toHaveClass("active:translate-y-px");
    const consult = screen.getByRole("link", { name: "Nhận tư vấn: Dự án Sông Sài Gòn" });
    expect(consult).toHaveClass("relative", "z-10");
    expect(consult.getAttribute("href")).toMatch(/#lead-form$/);
    expect(consult).not.toHaveAttribute("data-stretched-link");
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("group-hover/spot:text-accent-text");
  });

  it("thiếu dữ liệu: địa chỉ → tỉnh, giá → 'Liên hệ', ô diện tích / bàn giao trống bị bỏ, không danh mục → chỉ badge tình trạng", () => {
    renderWithIntl(<ProjectSpotlightContent data={card({ categoryName: null })} headingLevel="h3" />);
    expect(screen.getByText("TP. Hồ Chí Minh")).toBeInTheDocument();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Giá từ"]);
    expect(screen.getByText("Liên hệ")).toBeInTheDocument();
    expect(screen.queryByText("Căn hộ")).toBeNull();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });
});
