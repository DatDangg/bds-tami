"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface SliderThumbLabel {
  /** Tên của đầu kéo (vd "Giá thấp nhất"). */
  label: string;
  /** Giá trị đọc cho trình đọc màn hình (vd "5 tỷ"). */
  valueText: string;
}

/**
 * Thanh trượt theo token (Radix Slider: bàn phím ←/→/↑/↓, PageUp/PageDown, Home/End sẵn có; `role="slider"` + `aria-valuenow/min/max` trên từng đầu).
 * Mỗi đầu kéo cần `thumbs[i]` để có tên + `aria-valuetext`. Đầu kéo 20px, vùng chạm nới lên 44px.
 */
export function Slider({ className, thumbs, ...props }: ComponentProps<typeof SliderPrimitive.Root> & { thumbs: readonly SliderThumbLabel[] }) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-50", className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-pill bg-surface-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((thumb, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumb.label}
          aria-valuetext={thumb.valueText}
          className="relative block size-5 cursor-grab rounded-full border-2 border-surface bg-primary shadow-md after:absolute after:-inset-3 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
