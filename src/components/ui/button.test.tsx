import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";

// BL-057 n-2: `buttonVariants` gọi trần (link không qua `Button`) phải trả chuỗi đã gộp Tailwind — không còn
// `border-transparent` của lớp nền cạnh viền của biến thể (viền vô hình đo ở BL-056 r1).
describe("buttonVariants (gọi trần, không bọc cn)", () => {
  it.each([
    ["secondary", "border-border"],
    ["chip", "border-on-dark/30"],
    ["outline", "border-text"],
  ] as const)("variant %s chỉ còn viền của biến thể, không còn border-transparent", (variant, borderClass) => {
    const classes = buttonVariants({ variant }).split(" ");
    expect(classes).toContain("border");
    expect(classes).toContain(borderClass);
    expect(classes).not.toContain("border-transparent");
  });

  it("primary (không có viền riêng) vẫn giữ border-transparent", () => {
    expect(buttonVariants({ variant: "primary" }).split(" ")).toContain("border-transparent");
  });

  it("giữ token cỡ chữ text-button / text-button-sm cạnh màu chữ của biến thể (không dùng twMerge mặc định)", () => {
    const primary = buttonVariants().split(" ");
    expect(primary).toContain("text-button");
    expect(primary).toContain("text-primary-foreground");
    const outlineSm = buttonVariants({ variant: "outline", size: "sm" }).split(" ");
    expect(outlineSm).toContain("text-button-sm");
    expect(outlineSm).not.toContain("text-button");
    expect(outlineSm).toContain("text-text");
    expect(outlineSm).toContain("h-9");
  });

  it("cn(buttonVariants(), extra) vẫn cho extra ghi đè", () => {
    const classes = cn(buttonVariants(), "h-9").split(" ");
    expect(classes).toContain("h-9");
    expect(classes).not.toContain("h-11");
  });
});

describe("Button", () => {
  it("mặc định là primary md, type=button", () => {
    render(<Button>Nhận tư vấn</Button>);
    const button = screen.getByRole("button", { name: "Nhận tư vấn" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground", "text-button", "h-11", "uppercase", "rounded-pill");
  });

  it.each([
    ["primary", ["bg-primary", "hover:bg-primary-hover"]],
    ["secondary", ["bg-surface", "border-border", "text-accent-text"]],
    ["chip", ["border-on-dark/30", "bg-transparent", "text-on-dark"]],
    ["outline", ["border-text", "bg-transparent", "hover:bg-text"]],
    ["dark", ["bg-dark", "text-on-dark"]],
    ["ghost", ["bg-transparent", "hover:text-accent-text"]],
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
