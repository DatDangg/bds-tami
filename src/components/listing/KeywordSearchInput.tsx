"use client";

import { type ComponentProps, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface KeywordSearchInputProps extends Omit<ComponentProps<typeof Input>, "defaultValue" | "value" | "ref"> {
  /** Từ khoá đang trên URL (`?q=`). */
  keyword: string;
}

/**
 * Ô tìm uncontrolled nhưng nạp lại khi `keyword` trên URL đổi (back / chip) MÀ KHÔNG remount:
 * dùng `key` theo từ khoá thì Enter trong ô làm input bị tạo lại → focus rơi về `body`.
 * Giữ `defaultValue` để SSR / no-JS vẫn có từ khoá.
 */
export function KeywordSearchInput({ keyword, ...props }: KeywordSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Chỉ nạp lại khi từ khoá trên URL THẬT SỰ đổi (không chạy lúc mount: chữ gõ trước khi hydrate xong được giữ).
  const lastKeyword = useRef(keyword);
  useEffect(() => {
    if (lastKeyword.current === keyword) return;
    lastKeyword.current = keyword;
    const input = inputRef.current;
    if (input && input.value !== keyword) input.value = keyword;
  }, [keyword]);
  return <Input ref={inputRef} defaultValue={keyword} {...props} />;
}
