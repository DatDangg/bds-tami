import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBanner } from "./PageBanner";

const image = { url: "/api/media/file/banner.jpg", alt: "", width: 1600 };

describe("PageBanner", () => {
  it("có ảnh: biến thể Ảnh với scrim riêng, khung cao cố định, ảnh trang trí; mô tả dùng chữ trắng", () => {
    const { container } = render(<PageBanner title="Dự án" description="Danh sách dự án" image={image} />);
    expect(screen.getByRole("heading", { level: 1, name: "Dự án" })).toBeInTheDocument();
    expect(screen.getByText("Danh sách dự án")).toHaveClass("text-on-dark");
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
    expect(container.querySelector(".bg-overlay")).toBeNull();
    expect(container.querySelector("section")?.className).toContain("h-[clamp(240px,42svh,440px)]");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("không có ảnh: biến thể Chữ như trước (không scrim, không ảnh)", () => {
    const { container } = render(<PageBanner title="Dự án" description="Danh sách dự án" />);
    expect(container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("section")).toHaveClass("bg-bg-alt");
    expect(screen.getByText("Danh sách dự án")).toHaveClass("text-text-secondary");
  });
});

describe("PageBanner size", () => {
  it("compact: ảnh cao cố định 240px + chừa 3rem đáy cho băng tìm kiếm, mô tả tối đa 2 dòng", () => {
    const { container } = render(<PageBanner title="Cho thuê" description="Mô tả" image={image} size="compact" />);
    const section = container.querySelector("section")!;
    expect(section).toHaveClass("h-60", "pb-12");
    expect(section.className).not.toContain("clamp");
    expect(screen.getByText("Mô tả")).toHaveClass("line-clamp-2");
  });

  it("mặc định: giữ chiều cao theo viewport như trước (pháp lý, liên hệ, dịch vụ, 404)", () => {
    const { container } = render(<PageBanner title="Liên hệ" description="Mô tả" image={image} />);
    expect(container.querySelector("section")?.className).toContain("h-[clamp(240px,42svh,440px)]");
    expect(screen.getByText("Mô tả")).not.toHaveClass("line-clamp-2");
  });
});
