"use client";

import { useField } from "@payloadcms/ui";
import { useRef, useState } from "react";

import { copyTextToClipboard } from "@/lib/admin/clipboard";

/** Field `code` vẫn nằm trong form state (cột/tìm kiếm danh sách không đổi) nhưng không vẽ ô nhập riêng ở sidebar: mã hiện to ở đầu form. */
export function RentalCodeHiddenField() {
  return null;
}

type CopyState = "idle" | "copied" | "failed";

function selectContents(element: HTMLElement | null) {
  if (!element) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** Đầu form Cho thuê: "Mã tin: CT-000123" chữ to + nút Sao chép để dán vào Zalo/email. Tạo mới: nhắc mã tự sinh khi lưu. */
export function RentalCodeBanner() {
  const { value } = useField<string>({ path: "code" });
  const codeRef = useRef<HTMLSpanElement>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const code = typeof value === "string" ? value.trim() : "";

  if (code === "") {
    return <p className="tami-field-hint tami-rental-code__pending">Mã tin tự tạo khi lưu</p>;
  }

  const copy = async () => {
    const copied = await copyTextToClipboard(code);
    if (!copied) selectContents(codeRef.current);
    setCopyState(copied ? "copied" : "failed");
  };

  return (
    <div className="tami-rental-code">
      <span className="tami-rental-code__label">Mã tin:</span>
      <span className="tami-rental-code__value" ref={codeRef}>
        {code}
      </span>
      <button type="button" className="tami-contact-action" onClick={copy}>
        Sao chép
      </button>
      <span className="tami-rental-code__status" role="status" aria-live="polite">
        {copyState === "copied" && "Đã sao chép"}
        {copyState === "failed" && "Không sao chép tự động được — mã đã được chọn sẵn, nhấn Ctrl+C"}
      </span>
    </div>
  );
}
