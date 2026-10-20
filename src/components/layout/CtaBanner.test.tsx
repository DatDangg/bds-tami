import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CtaBanner } from "./CtaBanner";

const image = { url: "/api/media/file/cta.jpg", alt: "", width: 1600 };
const base = { title: "Đăng ký tham quan", description: "Để lại thông tin", actionLabel: "Nhận tư vấn", actionHref: "/lien-he" };

describe("CtaBanner dùng chung", () => {
  it("không ảnh: khối tối như cũ, không scrim/ảnh, không nút phụ; mô tả dùng text-secondary của khối tối", () => {
    const { container } = render(<CtaBanner {...base} />);
    expect(container.querySelector("section")).toHaveClass("theme-dark-block");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByTestId("cta-scrim")).toBeNull();
    expect(screen.getByText("Để lại thông tin")).toHaveClass("text-text-secondary");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("data-variant", "primary");
  });

  it("có ảnh: ảnh trang trí lazy sizes=100vw + scrim banner đè ảnh, khung cao tối thiểu cố định, mô tả chữ trắng", () => {
    const { container } = render(<CtaBanner {...base} backgroundImage={image} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img?.getAttribute("sizes")).toBe("100vw");
    expect(screen.getByTestId("cta-scrim")).toHaveClass("bg-banner-scrim");
    expect(container.querySelector("section")?.className).toContain("min-h-[26rem]");
    expect(container.querySelector("section")).toHaveClass("theme-dark-block");
    expect(screen.getByText("Để lại thông tin")).toHaveClass("text-on-dark");
  });

  it("nút phụ: biến thể chip (chỉ dùng trên nền tối/scrim), chỉ khi có cả nhãn lẫn link", () => {
    const { unmount } = render(<CtaBanner {...base} backgroundImage={image} secondaryLabel="Xem dự án" secondaryHref="/du-an" />);
    expect(screen.getByRole("link", { name: "Xem dự án" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("link", { name: "Xem dự án" })).toHaveAttribute("data-variant", "chip");
    unmount();
    const onlyLabel = render(<CtaBanner {...base} secondaryLabel="Xem dự án" />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    onlyLabel.unmount();
    render(<CtaBanner {...base} secondaryHref="/du-an" />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("align: mặc định center (S14 không đổi); start → chữ + nút canh trái", () => {
    const centered = render(<CtaBanner {...base} />);
    expect(screen.getByRole("heading", { level: 2 }).parentElement).toHaveClass("items-center", "text-center");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" }).parentElement).toHaveClass("justify-center");
    centered.unmount();
    render(<CtaBanner {...base} align="start" />);
    const wrapper = screen.getByRole("heading", { level: 2 }).parentElement;
    expect(wrapper).toHaveClass("items-start", "text-left");
    expect(wrapper).not.toHaveClass("text-center");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" }).parentElement).toHaveClass("justify-start");
  });
});
