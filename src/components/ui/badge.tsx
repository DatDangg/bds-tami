import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Biến thể theo bảng badge nội dung công khai (tokens §1.5).
const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-1 font-sans text-xsmall font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        // Đang mở bán / Sắp mở bán
        primary: "bg-primary text-badge-foreground",
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
