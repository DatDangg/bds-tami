import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("mặc định là primary md, type=button", () => {
    render(<Button>Nhận tư vấn</Button>);
    const button = screen.getByRole("button", { name: "Nhận tư vấn" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground", "text-button", "h-11", "uppercase");
  });

  it.each([
    ["primary", ["bg-primary", "hover:bg-primary-hover"]],
    ["outline", ["border-text", "bg-transparent", "hover:bg-text"]],
    ["dark", ["bg-dark", "text-on-dark"]],
    ["ghost", ["bg-transparent", "hover:underline"]],
  ] as const)("variant %s render đúng class", (variant, classes) => {
    render(<Button variant={variant}>Nút</Button>);
    expect(screen.getByRole("button")).toHaveClass(...classes);
  });

  it.each([
    ["sm", "h-9 text-button-sm"],
    ["md", "h-11"],
    ["lg", "h-13"],
  ] as const)("size %s -> %s", (size, heightClass) => {
    render(<Button size={size}>Nút</Button>);
    expect(screen.getByRole("button")).toHaveClass(heightClass);
  });

  it("disabled dùng opacity + not-allowed và không bấm được", () => {
    render(<Button disabled>Nút</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("asChild render phần tử con (link) mà không ép type=button", () => {
    render(
      <Button asChild>
        <a href="tel:+84900000000">Liên hệ</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Liên hệ" });
    expect(link).toHaveClass("bg-primary");
    expect(link).not.toHaveAttribute("type");
  });

  it("className ghi đè class mặc định (twMerge)", () => {
    render(<Button className="h-14">Nút</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-14");
    expect(button).not.toHaveClass("h-11");
  });
});
