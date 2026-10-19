"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Popover = bảng nổi neo vào nút mở (bộ lọc phụ ≥ lg). Radix lo focus: vào bảng khi mở, Esc đóng, trả focus về nút.
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({ className, align = "end", sideOffset = 8, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn("relative z-(--z-overlay) rounded-xl border border-border bg-surface p-5 text-text shadow-lg", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
