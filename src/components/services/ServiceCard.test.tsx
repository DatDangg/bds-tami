import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceCard } from "./ServiceCard";

const data = { id: "s1", title: "Môi giới", slug: "moi-gioi", href: "/dich-vu/moi-gioi", summary: "Tư vấn trọn gói", cover: { url: "/api/media/file/s.jpg", alt: "", width: 1200 } };

describe("ServiceCard", () => {
  it("MỘT link tới trang dịch vụ, bo 20px, chữ nằm trong khung kính (chỉ --color-text)", () => {
    const { container } = render(<ServiceCard data={data} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dich-vu/moi-gioi");
    expect(link).toHaveClass("rounded-xl");
    expect(screen.getByRole("heading", { level: 3, name: "Môi giới" }).parentElement).toHaveClass("glass-panel", "text-text");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("không ảnh bìa: nền tối đặc, vẫn có khung chữ; mã nguồn không dùng chữ muted/on-dark trên kính", () => {
    const { container } = render(<ServiceCard data={{ ...data, cover: null }} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link")).toHaveClass("bg-dark-deep");
    const source = readFileSync("src/components/services/ServiceCard.tsx", "utf8");
    expect(source).not.toMatch(/text-on-dark|text-text-muted|text-text-secondary/);
  });
});
