"use client";

import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { CaretDown, Check } from "@/components/icons";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-surface px-4 font-sans text-body text-text focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 aria-invalid:border-error data-[placeholder]:text-muted-foreground [&>span]:min-w-0 [&>span]:truncate [&>span]:text-left",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDown size={16} aria-hidden="true" className="shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={4}
        collisionPadding={8}
        className={cn(
          "relative z-(--z-modal) max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center rounded-sm py-2 pr-9 pl-3 font-sans text-body outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
        <Check size={16} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
