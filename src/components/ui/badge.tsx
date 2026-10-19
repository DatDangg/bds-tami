import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Biến thể theo bảng badge nội dung công khai (tokens §1.5).
const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-2.5 py-1 font-sans text-xsmall font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        // Sắp mở bán
        primary: "bg-(image:--gradient-gold) text-badge-foreground",
        // Đang bán (BL-020): gradient xanh từ --color-success.
        success: "bg-(image:--gradient-success) text-on-dark",
        // Đã bàn giao
        neutral: "bg-surface-muted text-text",
        // Đã thuê
        dark: "bg-dark text-on-dark",
        // Đã kết thúc (ưu đãi)
        muted: "bg-surface-muted text-text-muted",
        // Hạn ưu đãi còn <= 3 ngày
        warning: "bg-warning-subtle text-warning",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant ?? "primary"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
