import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Kích thước theo tokens §10: sm 36px (chỉ desktop), md 44px (đủ touch target), lg 52px.
export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill border border-transparent font-sans text-button font-semibold uppercase transition-colors duration-(--duration-fast) ease-(--ease-standard) active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        // Nền trắng + viền + chữ accent-text (BL-020); trong khối tối token tự đổi sang nền tối + chữ vàng.
        secondary: "border-border bg-surface text-accent-text hover:border-accent-text",
        // Chip/nút phụ: CHỈ dùng trong .theme-dark-block hoặc trên scrim >= --color-overlay (chữ trắng, viền on-dark/30; trên nền sáng không đọc được).
        chip: "border-on-dark/30 bg-transparent text-on-dark hover:bg-on-dark/10",
        outline:
          "border-text bg-transparent text-text hover:bg-text hover:text-surface",
        dark: "bg-dark text-on-dark hover:bg-dark-deep",
        ghost:
          "bg-transparent text-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-5 text-button-sm",
        md: "h-11 px-6",
        lg: "h-13 px-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      // Mặc định type="button" để nút trong form không tự submit; chỉ áp cho <button>, không áp cho asChild (vd link).
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
