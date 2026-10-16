import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Giữ chỗ khi tải. Animation pulse bị prefers-reduced-motion tắt (globals.css).
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-muted", className)}
      {...props}
    />
  );
}
