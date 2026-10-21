"use client";

import { useEffect, type ReactNode } from "react";

import { UPLOAD_BUTTON_LABEL } from "../../lib/admin/payload-vi-overrides";

const SELECTOR = ".upload__createNewToggler";

/** Đổi chữ + tên đọc của nút upload; idempotent (chỉ ghi khi khác) nên không tự kích hoạt lại observer vô hạn. */
function relabelUploadButtons(root: ParentNode): void {
  for (const button of root.querySelectorAll<HTMLElement>(SELECTOR)) {
    // Chỉ ghi vào .btn__label (giữ nguyên cấu trúc .btn__content của Payload); nút lạ không có nhãn con thì ghi cả nút.
    const label = button.querySelector<HTMLElement>(".btn__label") ?? button;
    if (label.textContent !== UPLOAD_BUTTON_LABEL) label.textContent = UPLOAD_BUTTON_LABEL;
    if (button.getAttribute("aria-label") !== UPLOAD_BUTTON_LABEL) button.setAttribute("aria-label", UPLOAD_BUTTON_LABEL);
  }
}

/**
 * Nút "Tạo mới" của khung tải tệp/ảnh dùng chung khoá `general:createNew` với nút "Tạo mới" ở danh sách nên không ghi đè khoá được (BL-051 A3).
 * Provider này đổi riêng chữ + `aria-label` của `.upload__createNewToggler` thành "Tải lên"; ngắt observer khi unmount.
 */
export function UploadButtonLabel({ children }: { children: ReactNode }) {
  useEffect(() => {
    relabelUploadButtons(document);
    const observer = new MutationObserver(() => relabelUploadButtons(document));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return children;
}
