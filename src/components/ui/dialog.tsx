"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";

// Radix lo bẫy focus, Esc đóng, trả focus về nút mở, khoá cuộn nền (design-spec §1.4).
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-display text-h3 text-text", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-small text-text-secondary", className)}
      {...props}
    />
  );
}

// closeLabel bắt buộc: nút chỉ có icon phải có aria-label theo ngôn ngữ đang xem (do nơi dùng truyền vào từ i18n).
export function DialogContent({
  className,
  children,
  closeLabel,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { closeLabel: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-(--z-modal) bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-(--z-modal) grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-md bg-surface p-6 text-text shadow-lg data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text-secondary hover:text-text"
        >
          <X size={20} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
