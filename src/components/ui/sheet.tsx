"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";

// Sheet = Dialog trượt từ mép (menu, bộ lọc mobile, thanh tìm). Cùng hành vi a11y với Dialog.
export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-h3 text-text", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-small text-text-secondary", className)}
      {...props}
    />
  );
}

// --sheet-offset là điểm bắt đầu/kết thúc của keyframes sheet-in/sheet-out (globals.css).
const sheetVariants = cva(
  "fixed z-(--z-overlay) flex flex-col gap-4 bg-surface p-6 text-text shadow-lg data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 w-3/4 max-w-sm [--sheet-offset:translateX(100%)]",
        left: "inset-y-0 left-0 w-3/4 max-w-sm [--sheet-offset:translateX(-100%)]",
        top: "inset-x-0 top-0 max-h-dvh [--sheet-offset:translateY(-100%)]",
        bottom:
          "inset-x-0 bottom-0 max-h-dvh [--sheet-offset:translateY(100%)]",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export function SheetContent({
  className,
  children,
  closeLabel,
  side,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { closeLabel: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-(--z-overlay) bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side ?? "right"}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text-secondary hover:text-text"
        >
          <X size={20} aria-hidden="true" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
