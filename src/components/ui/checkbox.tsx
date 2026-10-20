"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

// Ô 20px; after:-inset-3 nới vùng chạm lên 44px (tokens §10). Đặt trong <label> để nhãn bấm được.
export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "relative size-5 shrink-0 cursor-pointer rounded-[calc(var(--radius-md)/2)] border border-input bg-surface after:absolute after:-inset-3 after:content-[''] data-[state=checked]:border-primary-foreground data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-primary-foreground">
        <Check size={14} weight="bold" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
