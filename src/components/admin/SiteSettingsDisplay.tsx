"use client";

import { useField } from "@payloadcms/ui";

/** Phiên bản chính sách bảo mật: chữ nhỏ chỉ đọc thay ô nhập bị khoá (dữ liệu/access giữ; hook trang chính sách ghi giá trị). */
export function PrivacyPolicyVersionField({ path }: { path: string }) {
  const { value } = useField<string>({ path });
  const version = typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  return (
    <p className="tami-field-hint tami-privacy-version">
      {version === null
        ? "Chưa có phiên bản chính sách bảo mật (tự cập nhật khi xuất bản trang chính sách)."
        : `Phiên bản chính sách bảo mật hiện tại: ${version} (tự cập nhật khi xuất bản trang chính sách)`}
    </p>
  );
}
