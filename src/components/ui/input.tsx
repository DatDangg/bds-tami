import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Cao 48px, viền input-border đạt 3:1 (WCAG 1.4.11). Lỗi: truyền aria-invalid. Label hiển thị do form quản lý.
export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-input bg-surface px-4 font-sans text-body text-text transition-colors duration-(--duration-fast) placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 aria-invalid:border-error",
        className,
      )}
      {...props}
    />
  );
}
