"use client";

import { useEffect, type ReactNode } from "react";

import { FIELD_ERRORS_TOAST_SELECTOR, focusFirstFieldError, markUnmatchedToasts, resolveFocusRoot } from "./form-error-focus";

function isFieldErrorsToast(node: Node) {
  return node instanceof Element && (node.matches(FIELD_ERRORS_TOAST_SELECTOR) || node.querySelector(FIELD_ERRORS_TOAST_SELECTOR) !== null);
}

/**
 * Form sửa của Payload không validate phía client; server trả lỗi theo ô + một toast gom danh sách (FieldErrorsToast).
 * Toast đó bị ẩn bằng CSS (styles/_field-errors.scss) vì lỗi đã hiện dưới từng ô — nhưng vẫn nằm trong DOM nên làm tín hiệu
 * "vừa Lưu lỗi theo ô": provider mở tab/khối chứa ô lỗi đầu tiên, cuộn tới và focus (form-error-focus.ts). Chạy 1 lần mỗi lần Lưu lỗi. Không ô nào hiện lỗi (vd. lỗi gắn path không có trên màn) → gắn cờ lên toast để CSS không ẩn nó.
 * Provider đứng ngoài <Form> nên không dùng hook form của Payload; đọc DOM.
 */
export function FormErrorFocus({ children }: { children: ReactNode }) {
  useEffect(() => {
    let run = 0;
    const observer = new MutationObserver((mutations) => {
      const hasErrorToast = mutations.some((mutation) => Array.from(mutation.addedNodes).some(isFieldErrorsToast));
      if (!hasErrorToast) return;
      const current = ++run;
      void focusFirstFieldError(resolveFocusRoot(), () => current !== run).then((found) => {
        if (!found && current === run) markUnmatchedToasts(document);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      run++;
      observer.disconnect();
    };
  }, []);

  return children;
}
