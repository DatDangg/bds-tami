import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHero } from "./PageHero";

const image = { url: "/api/media/file/hero.jpg", alt: "", width: 1600 };

describe("PageHero", () => {
  it("đúng một h1: dòng 1 + dòng 2 vàng (span block); eyebrow + mô tả tối đa 2 dòng", () => {
    render(<PageHero size="list" eyebrow="Danh mục" title="Dự án" titleAccent="đáng sống" description="Mô tả dự án" image={image} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading).toHaveTextContent("Dự ánđáng sống");
    expect(heading.querySelector("span")).toHaveTextContent("đáng sống");
    expect(heading.querySelector("span")).toHaveClass("block", "text-primary");
    expect(screen.getByText("Danh mục")).toHaveClass("text-primary");
    expect(screen.getByText("Mô tả dự án")).toHaveClass("line-clamp-2", "text-on-dark");
  });

  it("hai cỡ có chiều cao cố định: list 440 (mobile 360), short 340 (mobile 280)", () => {
    const list = render(<PageHero size="list" title="A" />);
    expect(list.container.querySelector("section")).toHaveClass("h-[360px]", "md:h-[440px]");
    expect(list.container.querySelector("section")).toHaveAttribute("data-hero-size", "list");
    list.unmount();
    const short = render(<PageHero size="short" title="A" />);
    expect(short.container.querySelector("section")).toHaveClass("h-[280px]", "md:h-[340px]");
  });

  it("chừa đáy cho thẻ lọc mặc định ở list, không ở short", () => {
    const list = render(<PageHero size="list" title="A" />);
    expect(list.container.querySelector("h1")?.parentElement).toHaveClass("md:pb-[120px]");
    list.unmount();
    const short = render(<PageHero size="short" title="A" />);
    expect(short.container.querySelector("h1")?.parentElement).not.toHaveClass("md:pb-[120px]");
  });

  it("có ảnh: ảnh trang trí priority + scrim token; không ảnh: nền tối token, không ảnh, không scrim", () => {
    const withImage = render(<PageHero size="short" title="A" image={image} />);
    expect(withImage.container.querySelector("img")).toHaveAttribute("alt", "");
    expect(withImage.container.querySelector(".bg-banner-scrim")).not.toBeNull();
    withImage.unmount();
    const noImage = render(<PageHero size="short" title="A" />);
    expect(noImage.container.querySelector("img")).toBeNull();
    expect(noImage.container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(noImage.container.querySelector("section")).toHaveClass("bg-dark-deep");
  });

  it("slot breadcrumb ở góc trên-trái, trước chữ hero", () => {
    render(<PageHero size="short" title="A" breadcrumb={<nav aria-label="crumb" />} />);
    const crumb = screen.getByRole("navigation", { name: "crumb" });
    expect(crumb.parentElement?.parentElement).toHaveClass("absolute", "top-5");
    expect(crumb.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
